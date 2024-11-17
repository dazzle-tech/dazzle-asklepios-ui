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
  Badge
} from 'rsuite';
import {
  useGetPatientRelationsQuery,
  useGetPatientsQuery,
  useSavePatientMutation,

} from '@/services/patientService';
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
import './styles.less'
const EmployeeRegistration = () => {
  const patientSlice = useAppSelector(state => state.patient);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCriterion, setSelectedCriterion] = useState('');
  const [searchResultVisible, setSearchResultVisible] = useState(false);
  const [patientSearchTarget, setPatientSearchTarget] = useState('primary');
  const [validationResult, setValidationResult] = useState({});
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [newAttachmentSrc, setNewAttachmentSrc] = useState(null);
  const [upload, uploadMutation] = useUploadMutation();
  const [newAttachmentType, setNewAttachmentType] = useState();
  const [localEmployee, setLocalEmployee] = useState<ApPatient>({ ...newApPatient });//Replace To Employee
  const dispatch = useAppDispatch();
  const [Update, UpdateMutation] = useUpdateAttachmentDetailsMutation();
  const profileImageFileInputRef = useRef(null);
  const [employeeImage, setEmployeeImage] = useState<ApAttachment>(undefined);
  const attachmentFileInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [employeeAttachments, setEmployeeAttachments] = useState([]);
  const [newAttachmentDetails, setNewAttachmentDetails] = useState('');
  const [selectedEmployeeAttacment, setSelectedEmployeeAttacment] = useState<any>({
    ...newApPatientInsurance
  });
  const [requestedEmployeeAttacment, setRequestedEmployeeAttacment] = useState();
  const [actionType, setActionType] = useState(null); // 'view' or 'download'
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [savePatient, savePatientMutation] = useSavePatientMutation();
  const navigate = useNavigate();
  //LOV Definition
  const { data: suffixLovQueryResponse } = useGetLovValuesByCodeQuery('SUFFIX');
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  const { data: civilStatusLovQueryResponse } = useGetLovValuesByCodeQuery('MARI_STATUS');
  const { data: nationalityLovQueryResponse } = useGetLovValuesByCodeQuery('NAT');
  const { data: religionLovQueryResponse } = useGetLovValuesByCodeQuery('REL');
  const { data: ethnicityLovQueryResponse } = useGetLovValuesByCodeQuery('ETH');
  const { data: occupationLovQueryResponse } = useGetLovValuesByCodeQuery('OCCP');
  const { data: responsiblePartyLovQueryResponse } = useGetLovValuesByCodeQuery('RESP_PARTY');
  const { data: educationalLevelLovQueryResponse } = useGetLovValuesByCodeQuery('EDU_LEVEL');
  const { data: relationsLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
  const { data: preferredWayOfContactLovQueryResponse } = useGetLovValuesByCodeQuery('PREF_WAY_OF_CONTACT');
  const { data: primaryLangLovQueryResponse } = useGetLovValuesByCodeQuery('LANG');
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
  const { data: StateProvLovQueryResponse } = useGetLovValuesByCodeQuery('STATE_PROV');
  const { data: cityLovQueryResponse } = useGetLovValuesByCodeQuery('CITY');
  const { data: districtLovQueryResponse } = useGetLovValuesByCodeQuery('DISTRICT');
  const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
  const { data: docCountryLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_CNTRY');


  ////////////////
  const [employeeRelationListRequest, setEmployeeRelationListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 1000
  });
  //Replace to Employee
  const { data: patientRelationsResponse, refetch: patientRelationsRefetch } = useGetPatientRelationsQuery(
    {
      listRequest: employeeRelationListRequest,
      key: localEmployee?.key
    },
    { skip: !localEmployee.key }
  );
  const [uploadedAttachmentOpject, setUploadedAttachmentOpject] = useState({
    formData: null,
    type: null,
    refKey: null
  });


  //Replace To Save Employee
  const handleSave = () => {
    savePatient({ ...localEmployee, incompletePatient: false, unknownPatient: false }).unwrap();
  };

  const { data: fetchPatintAttachmentsResponce, refetch: attachmentRefetch } =
    useFetchAttachmentLightQuery({ refKey: localEmployee?.key }, { skip: !localEmployee?.key });
  const [selectedPatientRelation, setSelectedPatientRelation] = useState<any>({
    ...newApPatientRelation
  });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: !searchKeyword || searchKeyword.length < 3
  });
  const enableEdit = () => {
    setValidationResult(undefined);
  };

  const startRegistration = () => {
    setValidationResult(undefined);
  };
  const handleImageClick = type => {
    setNewAttachmentType(type); // PATIENT_PROFILE_ATTACHMENT or PATIENT_PROFILE_PICTURE

    if (patientSlice.patient && editing) profileImageFileInputRef.current.click();
  };
  const handleUpdateAttachmentDetails = () => {
    Update({
      key: selectedEmployeeAttacment.key,
      attachmentDetails: newAttachmentDetails
    })
      .unwrap()
      .then(() => handleFinishUploading());
  };
  const handleClearDocument = () => {
    setDocumentModalOpen(false);
    // setDocument(newApPatientSecondaryDocuments);

  };
  const handleEditDocument = () => {
    // if (selectedDocument) {
    //   setDocumentModalOpen(true);
    // }
  };
  const {
    data: patientListResponse,
    isLoading: isGettingPatients,
    isFetching: isFetchingPatients,
    refetch: refetchPatients
  } = useGetPatientsQuery({ ...listRequest, filterLogic: 'or' });
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
  const handleAttachmentFileUploadClick = type => {
    setNewAttachmentType(type); // PATIENT_PROFILE_ATTACHMENT or PATIENT_PROFILE_PICTURE
    if (patientSlice.patient && attachmentsModalOpen) attachmentFileInputRef.current.click();
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
  const handleCleareAttachment = () => {
    setAttachmentsModalOpen(false);
  };
  const handleGoToVisitRegistration = () => {
    navigate('/visit-registration');
  };
  const handleFileUpload = async event => {
    if (!patientSlice.patient) return;

    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      if (attachmentsModalOpen) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewAttachmentSrc(reader.result);
        };
        reader.readAsDataURL(selectedFile);

        setUploadedAttachmentOpject({
          formData: formData,
          type: newAttachmentType,
          refKey: patientSlice.patient.key
        });
      }
    }
  };
  const handleFinishUploading = () => {
    setUploadedAttachmentOpject({
      formData: null,
      type: null,
      refKey: null
    });
    setNewAttachmentSrc(null);
    setNewAttachmentType(null);
    setNewAttachmentDetails('');
    setAttachmentsModalOpen(false);
    attachmentRefetch();
    setSelectedEmployeeAttacment(null);
    //handleAttachmentSelected(null);
    setActionType(null);
  };

  const handleSelectEmployee = data => {
    if (patientSearchTarget === 'primary') {
      // selecteing primary patient (localEmployee)
      setLocalEmployee(data);
      dispatch(setPatient(data));
    } else if (patientSearchTarget === 'relation') {
      // selecting patient for relation patient key
      setSelectedPatientRelation({
        ...selectedPatientRelation,
        relativePatientKey: data.key,
        relativePatientObject: data
      });
    }
    setSearchResultVisible(false);
  };
  //Replace to Employee
  const handleFileChange = async event => {
    if (!patientSlice.patient) return;

    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      if (attachmentsModalOpen) {
      } else {
        upload({
          formData: formData,
          type: 'PATIENT_PROFILE_PICTURE',
          refKey: patientSlice.patient.key,
          details: `Profile Picture for ${patientSlice.patient.fullName}`
        })
          .unwrap()
          .then(() => attachmentRefetch());
      }
    }
  };

  const handleDownloadSelectedPatientAttachment = attachmentKey => {
    setRequestedEmployeeAttacment(attachmentKey);
    setActionType('download');
  };
  const searchCriteriaOptions = [
    { label: 'MRN', value: 'patientMrn' },
    { label: 'Document Number', value: 'documentNo' },
    { label: 'Full Name', value: 'fullName' },
    { label: 'Archiving Number', value: 'archivingNumber' },
    { label: 'Primary Phone Number', value: 'mobileNumber' },
    { label: 'Date of Birth', value: 'dob' },
  ];
  const fetchemployeeImageResponse = useFetchAttachmentQuery(
    {
      type: 'PATIENT_PROFILE_PICTURE',
      refKey: localEmployee.key
    },
    { skip: !localEmployee.key }
  );
  useEffect(() => {
    if (uploadMutation.status === 'fulfilled') {
      dispatch(notify('patient image uploaded'));
      if (!attachmentsModalOpen) setEmployeeImage(uploadMutation.data);
    }
  }, [uploadMutation]);

  useEffect(() => {
    if (
      fetchemployeeImageResponse.isSuccess &&
      fetchemployeeImageResponse.data &&
      fetchemployeeImageResponse.data.key
    ) {
      setEmployeeImage(fetchemployeeImageResponse.data);
    } else {
      setEmployeeImage(undefined);
    }
  }, [fetchemployeeImageResponse]);
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

  return (
    <>
      <Panel
        header={
          <h3 className="title">
            <Translate>Employee Profile</Translate>
          </h3>
        }
      >
        <Panel bordered>
          <ButtonToolbar>
            {conjureEmployeeSearchBar('primary')}
            <Divider vertical />
            <IconButton
              color="violet"
              appearance="primary"
              icon={<PlusRound />}
            // disabled={editing || localEmployee.key !== undefined}
            // onClick={startRegistration}
            >
              <Translate>New Employee</Translate>
            </IconButton>
            <IconButton
              appearance="primary"
              color="cyan"
              icon={<Edit />}
            // onClick={enableEdit}
            // disabled={editing || !localEmployee.key}
            >
              <Translate>Edit</Translate>
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
              color="cyan"
              icon={<PageIcon />}
              // disabled={editing || !localEmployee.key}
              onClick={() => handleGoToVisitRegistration()}
            >
              <Translate>Visit Registration</Translate>
            </IconButton>
            <IconButton
              appearance="ghost"
              color="cyan"
              icon={<History />}
            // disabled={editing || localEmployee.key === undefined}
            // onClick={()=>handleGoToVisitRegistration()}
            >
              <Translate>Visit History</Translate>
            </IconButton>
          </ButtonToolbar>
        </Panel>
        <br />
        <Panel
          bordered
          header={
            <h5 className="title">
              <Translate>Basic Information</Translate>
            </h5>
          }
        >
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
                {localEmployee.key && (
                  <Whisper
                    placement="top"
                    controlId="control-id-click"
                    trigger="hover"
                    speaker={
                      <Tooltip>
                        {localEmployee.verified ? 'Verified Patient' : 'Unverified Patient'}
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
                      {!localEmployee.verified && (
                        <Icon style={{ color: 'red' }} as={VscUnverified} />
                      )}
                      {localEmployee.verified && (
                        <Icon style={{ color: 'green' }} as={VscVerified} />
                      )}
                    </div>
                  </Whisper>
                )}

                {localEmployee.key && (
                  <Whisper
                    style={{ marginTop: '50px' }}
                    placement="bottom"
                    controlId="control-id-click"
                    trigger="hover"
                    speaker={
                      <Tooltip>
                        {localEmployee.incompletePatient ? 'incomplete Patient' : 'complete Patient'}
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
                      {localEmployee.incompletePatient && (
                        <Icon style={{ color: 'red' }} as={VscUnverified} />
                      )}
                      {!localEmployee.incompletePatient && (
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
                  onClick={() => handleImageClick('PATIENT_PROFILE_PICTURE')}
                  src={
                    employeeImage && employeeImage.fileContent
                      ? `data:${employeeImage.contentType};base64,${employeeImage.fileContent}`
                      : 'https://img.icons8.com/?size=100&id=0lg0kb05hrOz&format=png&color=000000'
                  }
                />
              </div>
              <Form layout="inline" fluid>
                <MyInput
                  width={130}
                  vr={validationResult}
                  column
                  fieldLabel="Person ID"
                  fieldName="patientMrn"
                  record={localEmployee}
                  setRecord={setLocalEmployee}
                  disabled
                />

              </Form>
            </Stack.Item>
            <Stack.Item grow={15}>
              <Form layout="inline" fluid>
                <MyInput
                  width={165}
                  vr={validationResult}
                  column
                  fieldLabel="Suffix"
                  fieldType="select"
                  fieldName="genderLkey"
                  selectData={suffixLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={""}
                  setRecord={""}
                />
                <MyInput
                  required
                  width={165}
                  vr={validationResult}
                  column
                  fieldName="firstName"
                  record={""}
                  setRecord={""}
                //  disabled={!editing}
                />
                <MyInput
                  required
                  width={165}
                  vr={validationResult}
                  column
                  fieldName="secondName"
                  record={""}
                  setRecord={""}
                //  disabled={!editing}
                />
                <MyInput
                  width={165}
                  vr={validationResult}
                  column
                  fieldName="thirdName"
                  record={""}
                  setRecord={""}
                //  disabled={!editing}
                />
                <MyInput
                  required
                  width={165}
                  vr={validationResult}
                  column
                  fieldName="lastName"
                  record={""}
                  setRecord={""}
                //  disabled={!editing}
                />
                <MyInput
                  width={340}
                  vr={validationResult}
                  column
                  fieldName="fullName"
                  record={""}
                  setRecord={""}
                  disabled={true}
                  readOnly={true}
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
                  record={localEmployee}
                  setRecord={setLocalEmployee}
                // disabled={!editing}
                />
                <MyInput
                  width={165}
                  fieldLabel="Alias"
                  vr={validationResult}
                  column
                  fieldName="alias"
                  record={""}
                  setRecord={""}
                //  disabled={!editing}
                />
                <MyInput
                  width={165}
                  vr={validationResult}
                  column
                  fieldType="date"
                  fieldLabel="DOB"
                  fieldName="dob"
                  record={localEmployee}
                  setRecord={setLocalEmployee}
                //  disabled={!editing}
                />
                <MyInput
                  width={165}
                  fieldLabel="Place of Birth"
                  vr={validationResult}
                  column
                  fieldName="placeOfBirth"
                  record={""}
                  setRecord={""}
                //  disabled={!editing}
                />
                <MyInput
                  width={165}
                  vr={validationResult}
                  column
                  fieldLabel="Civil Status"
                  fieldType="select"
                  fieldName="civilStatusLkey"
                  selectData={civilStatusLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={""}
                  setRecord={""}
                //  disabled={!editing}
                />
                <MyInput
                  width={165}
                  vr={validationResult}
                  column
                  fieldLabel="Nationality"
                  fieldType="select"
                  fieldName="civilStatusLkey"
                  selectData={nationalityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={""}
                  setRecord={""}
                //  disabled={!editing}
                />
                <MyInput
                  width={165}
                  vr={validationResult}
                  column
                  fieldLabel="Religin"
                  fieldType="select"
                  fieldName="religionTypeLkey"
                  selectData={religionLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={""}
                  setRecord={""}
                // disabled={!editing}
                />

                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="SF code"
                  fieldName="sFCode"
                  record={""}
                  setRecord={""}
                //  disabled={!editing}
                />
                <MyInput
                  vr={validationResult}
                  column
                  fieldLabel="Seafarer’s Registration No."
                  fieldName="seafarer’sRegistrationNo"
                  record={""}
                  setRecord={""}
                //disabled={!editing || localEmployee.documentTypeLkey === 'NO_DOC'}
                />

              </Form>
            </Stack.Item>
          </Stack>

        </Panel>
        <br />
        <Panel
          bordered
          header={
            <h5 className="title">
              <Translate>Details</Translate>
            </h5>
          }>

          <Tabs>
            <TabList>
              <Tab>
                <Translate>Demographics</Translate>
              </Tab>
              <Tab>
                <Translate>Contact</Translate>
              </Tab>
              <Tab>
                <Translate>Address</Translate>
              </Tab>
              <Tab>
                <Translate>Extra Details</Translate>
              </Tab>
              <Tab>
                <Translate>Attachment</Translate>
              </Tab>
            </TabList>

            {/* Demopgraphics */}
            <TabPanel>
              <Form layout="inline" fluid>
                <MyInput
                  width={200}
                  vr={validationResult}
                  column
                  fieldLabel="First Name (Sec. Lang)"
                  fieldName="firstNameOtherLang"
                  selectDataValue="key"
                  record={""}
                  setRecord={""}
                />
                <MyInput
                  required
                  width={200}
                  vr={validationResult}
                  column
                  fieldLabel="Second Name (Sec. Lang)"
                  fieldName="secondNameOtherLang"
                  record={""}
                  setRecord={""}
                //  disabled={!editing}
                />
                <MyInput
                  required
                  width={200}
                  vr={validationResult}
                  column
                  fieldLabel="Third Name (Sec. Lang)"
                  fieldName="thirdNameOtherLang"
                  record={""}
                  setRecord={""}
                //  disabled={!editing}
                />
                <MyInput
                  required
                  width={200}
                  vr={validationResult}
                  column
                  fieldLabel="Last Name (Sec. Lang)"
                  fieldName="lastNameOtherLang"
                  record={""}
                  setRecord={""}
                //  disabled={!editing}
                />
                <br />
                <MyInput
                  width={200}
                  required
                  vr={validationResult}
                  column
                  fieldLabel="Ethnicity"
                  fieldType="select"
                  fieldName="ethnicityLkey"
                  selectData={ethnicityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={""}
                  setRecord={""}
                //  disabled={!editing}
                />
                <MyInput
                  width={200}
                  required
                  vr={validationResult}
                  column
                  fieldLabel="Occupation"
                  fieldType="select"
                  fieldName="occupationLkey"
                  selectData={occupationLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={""}
                  setRecord={""}
                //  disabled={!editing}
                />
                <MyInput
                  width={200}
                  required
                  vr={validationResult}
                  column
                  fieldLabel="Responsible Party"
                  fieldType="select"
                  fieldName="responsiblePartyLkey"
                  selectData={responsiblePartyLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={""}
                  setRecord={""}
                //  disabled={!editing}
                />
                <MyInput
                  required
                  width={200}
                  vr={validationResult}
                  column
                  fieldLabel="Educational Level"
                  fieldType="select"
                  fieldName="educationalLevelLkey"
                  selectData={educationalLevelLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={""}
                  setRecord={""}
                // disabled={!editing}
                />

              </Form>
            </TabPanel>

            {/* Contact */}
            <TabPanel>
              <Form layout="inline" fluid>
                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  required
                  fieldName="phoneNumber"
                  fieldLabel="Primary Mobile Number"
                  record={""}
                  setRecord={""}

                />
                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  fieldType="checkbox"
                  fieldName="receiveSms"
                  fieldLabel="Receive SMS"
                  record={""}
                  setRecord={""}

                />
                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  fieldLabel="Secondary Mobile Number"
                  fieldName="secondaryMobileNumber"
                  record={""}
                  setRecord={""}

                />
                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  fieldName="Whatsapp Number"
                  record={""}
                  setRecord={""}

                />
                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  fieldName="Viber Number"
                  record={""}
                  setRecord={""}

                />
                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  fieldLabel="Preferred Way of Contact"
                  fieldType="select"
                  fieldName="preferredContactLkey"
                  selectData={preferredWayOfContactLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={""}
                  setRecord={""}

                />
                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  fieldLabel="Preferred Language"
                  fieldType="select"
                  fieldName="primaryLanguageLkey"
                  selectData={primaryLangLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={""}
                  setRecord={""}

                />
                <br />
                <MyInput
                  vr={validationResult}
                  required
                  width={200}
                  column
                  fieldLabel="Email"
                  fieldName="email"
                  record={""}
                  setRecord={""}

                />
                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  fieldType="checkbox"
                  fieldName="receiveEmail"
                  fieldLabel="Receive Email"
                  record={""}
                  setRecord={""}

                />

                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  fieldLabel="Email #1"
                  fieldName="email"
                  record={""}
                  setRecord={""}

                />
                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  fieldLabel="Email #2"
                  fieldName="email"
                  record={""}
                  setRecord={""}

                />
                <br />
                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  fieldName="emergencyContactName"
                  record={""}
                  setRecord={""}

                />
                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  fieldLabel="Emergency Contact Relation"
                  fieldType="select"
                  fieldName="emergencyContactRelationLkey"
                  selectData={relationsLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={""}
                  setRecord={""}

                />
                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  fieldName="emergencyContactPhone"
                  record={""}
                  setRecord={""}

                />
              </Form>
            </TabPanel>

            {/* Address */}
            <TabPanel>
              <Form layout="inline" fluid>
                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  fieldLabel="Country"
                  fieldType="select"
                  fieldName="countryLovQueryResponse"
                  selectData={countryLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={""}
                  setRecord={""}

                />
                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  fieldLabel="State/Province"
                  fieldType="select"
                  fieldName="StateProvLovQueryResponse"
                  selectData={StateProvLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={""}
                  setRecord={""}

                />
                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  fieldLabel="City"
                  fieldType="select"
                  fieldName="cityLovQueryResponse"
                  selectData={cityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={""}
                  setRecord={""}

                />
                <MyInput
                  vr={validationResult}
                  width={200}
                  column
                  fieldLabel="District"
                  fieldType="select"
                  fieldName="districtLovQueryResponse"
                  selectData={districtLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={""}
                  setRecord={""}

                />
                <MyInput
                  width={200}
                  required
                  vr={validationResult}
                  column
                  fieldLabel="Street Name"
                  fieldName="streetName"
                  record={""}
                  setRecord={""}

                />
                <br />
                <MyInput
                  width={200}
                  required
                  vr={validationResult}
                  column
                  fieldLabel="House\Apartment Number"
                  fieldName="houseApartmentNo"
                  record={""}
                  setRecord={""}

                />
                <MyInput
                  width={200}
                  required
                  vr={validationResult}
                  column
                  fieldLabel="Postal\ZIP code"
                  fieldName="zipCode"
                  record={""}
                  setRecord={""}

                />
                <MyInput
                  width={200}
                  required
                  vr={validationResult}
                  column
                  fieldLabel="Additional Address Line"
                  fieldName="addressLine"
                  record={""}
                  setRecord={""}

                />

              </Form>
            </TabPanel>

            {/*Extra Details */}
            <TabPanel>
              <div className='detailsToolBarDiv'>

                <MyLabel label={"Details"} />
                <Input
                  as="textarea"
                  rows={3}
                  placeholder="Details"
                  style={{ width: 357 }}
                />
                <ButtonToolbar>
                  <IconButton
                    color="violet"
                    appearance="primary"
                    icon={<PlusRound />}
                    onClick={() => {
                      setDocumentModalOpen(true);
                      //  setSelectedDocument(newApPatientSecondaryDocuments)
                    }}
                  >
                    <Translate>New Document</Translate>
                  </IconButton>
                  <IconButton
                    appearance="primary"
                    color="cyan"
                    icon={<Edit />}
                  // onClick={enableEdit}
                  // disabled={editing || !localEmployee.key}
                  >
                    <Translate>Edit</Translate>
                  </IconButton>
                  <IconButton
                    appearance="primary"
                    color="blue"
                    icon={<Block />}
                  //onClick={handleClear}
                  >
                    <Translate>Delete</Translate>
                  </IconButton>
                </ButtonToolbar>
              </div>
              <br />

              <Table
                height={400}
                sortColumn={""}
                // sortType={}
                onSortColumn={(sortBy, sortType) => {
                  // if (sortBy)
                  //   setPatientRelationListRequest({
                  //     ...patientRelationListRequest,
                  //     sortBy,
                  //     sortType
                  //   });
                }}
                headerHeight={40}
                rowHeight={50}
                bordered
                cellBordered
                onRowClick={rowData => {
                  setSelectedPatientRelation(rowData);
                }}
              //data={patientAttachments ?? []}
              >
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Document Country</Translate>
                  </HeaderCell>
                  <Cell dataKey="" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Document Type</Translate>
                  </HeaderCell>
                  <Cell dataKey="" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Document Number</Translate>
                  </HeaderCell>
                  <Cell dataKey="" />
                </Column>
              </Table>
              <Modal
                open={false}
                onClose={() => handleClearDocument()}
              >
                <Modal.Header>
                  <Modal.Title>Secondary Document</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form layout="inline" fluid>
                    <MyInput
                      required
                      vr={validationResult}
                      column
                      fieldLabel="Document Country"
                      fieldType="select"
                      fieldName="documentCountryLkey"
                      selectData={docCountryLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={""}
                    // setRecord={(newRecord) => setSecondaryDocument({
                    //   ...secondaryDocument,
                    //   ...newRecord,
                    // })}
                    />

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
                      record={""}
                    // setRecord={(newRecord) => setDocument({
                    //   ...document,
                    //   ...newRecord,
                    // })}
                    />
                    <MyInput
                      required
                      vr={validationResult}
                      column
                      fieldLabel="Document Number"
                      fieldName="documentNo"
                      record={""}
                    // setRecord={(newRecord) => setDocument({
                    //   ...document,
                    //   ...newRecord,
                    // })}
                    //disabled={localEmployee.documentTypeLkey === 'NO_DOC'}
                    />
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button onClick={() => handleClearDocument()} appearance="subtle">
                    Cancel
                  </Button>
                  <Divider vertical />
                  <Button
                    // onClick={() => {
                    //   handleSaveDocument();
                    // }}
                    appearance="primary"
                  >
                    Save
                  </Button>
                </Modal.Footer>
              </Modal>

            </TabPanel>

            {/*Attachment */}
            <TabPanel>
              <Modal open={attachmentsModalOpen} onClose={() => handleCleareAttachment()}>
                <Modal.Header>
                  <Modal.Title>New/Edit Employee Attachments</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div
                    style={{
                      borderRadius: '5px',
                      border: '1px solid #e1e1e1',
                      margin: '2px',
                      position: 'relative',
                      bottom: 0,
                      width: '99%',
                      height: 400,
                      display: 'flex',
                      alignContent: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <input
                      // disabled={""}
                      type="file"
                      ref={attachmentFileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                      accept="image/*"
                    />

                    {newAttachmentSrc ? (
                      newAttachmentSrc ? (
                        <img
                          alt={'Attachment Preview'}
                          width={380}
                          height={380}
                          onClick={() =>
                            handleAttachmentFileUploadClick('PATIENT_PROFILE_ATTACHMENT')
                          }
                          src={newAttachmentSrc}
                        />
                      ) : (
                        <FileUploadIcon
                          onClick={() =>
                            handleAttachmentFileUploadClick('PATIENT_PROFILE_ATTACHMENT')
                          }
                          style={{ fontSize: '250px', marginTop: '10%' }}
                        />
                      )
                    ) : selectedEmployeeAttacment && selectedEmployeeAttacment.fileContent ? (
                      selectedEmployeeAttacment.contentType === 'application/pdf' ? (
                        <DetailIcon
                          onClick={() =>
                            handleAttachmentFileUploadClick('PATIENT_PROFILE_ATTACHMENT')
                          }
                          style={{ fontSize: '250px', marginTop: '10%' }}
                        />
                      ) : (
                        <img
                          alt={'Attachment Preview'}
                          width={380}
                          height={380}
                          onClick={() =>
                            handleAttachmentFileUploadClick('PATIENT_PROFILE_ATTACHMENT')
                          }
                          src={`data:${selectedEmployeeAttacment.contentType};base64,${selectedEmployeeAttacment.fileContent}`}
                        />
                      )
                    ) : (
                      <FileUploadIcon
                        onClick={() =>
                          handleAttachmentFileUploadClick('PATIENT_PROFILE_ATTACHMENT')
                        }
                        style={{ fontSize: '250px', marginTop: '10%' }}
                      />
                    )}
                  </div>
                  <br />

                  <br />
                  <Input
                    value={newAttachmentDetails || ''}
                    onChange={setNewAttachmentDetails}
                    as="textarea"
                    rows={3}
                    placeholder="Details"
                  />
                </Modal.Body>
                <Modal.Footer>
                  <Button onClick={() => handleCleareAttachment()} appearance="subtle">
                    Cancel
                  </Button>
                  <Divider vertical />
                  <Button
                    disabled={actionType ? false : !uploadedAttachmentOpject?.formData}
                    onClick={() => {
                      console.log(uploadedAttachmentOpject);
                      actionType === 'view'
                        ? handleUpdateAttachmentDetails()
                        : upload({ ...uploadedAttachmentOpject, details: newAttachmentDetails })
                          .unwrap()
                          .then(() => handleFinishUploading());
                    }}
                    appearance="primary"
                  >
                    Save
                  </Button>
                </Modal.Footer>
              </Modal>

              <ButtonToolbar style={{ padding: 1 }}>
                <IconButton
                  icon={<Icon as={FaPlus} />}
                  onClick={() => {
                    setAttachmentsModalOpen(true);
                  }}
                  appearance="primary"
                >
                  <Translate>New Attachment </Translate>
                </IconButton>
              </ButtonToolbar>

              <br />

              <Table
                height={400}
                sortColumn={employeeRelationListRequest.sortBy}
                sortType={employeeRelationListRequest.sortType}
                onSortColumn={(sortBy, sortType) => {
                  if (sortBy)
                    setEmployeeRelationListRequest({
                      ...employeeRelationListRequest,
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
                data={employeeAttachments ?? []}
              >
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Attachment Name</Translate>
                  </HeaderCell>
                  <Cell dataKey="fileName" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>File Type</Translate>
                  </HeaderCell>
                  <Cell dataKey="contentType" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Details</Translate>
                  </HeaderCell>
                  <Cell dataKey="extraDetails" />
                </Column>

                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Download</Translate>
                  </HeaderCell>
                  <Cell>
                    {attachment => (
                      <Button
                        appearance="link"
                        onClick={() => handleDownloadSelectedPatientAttachment(attachment.key)}
                      >
                        Download <FileDownloadIcon style={{ marginLeft: '10px', scale: '1.4' }} />
                      </Button>
                    )}
                  </Cell>
                </Column>
                <Column sortable flexGrow={4}>
                  <HeaderCell>
                    <Translate>Actions</Translate>
                  </HeaderCell>
                  <Cell>
                    {attachment => (
                      <div>
                        <Button
                          appearance="link"
                        // onClick={() => handleAttachmentSelected(attachment.key)}
                        >
                          Preview / Edit
                        </Button>

                        <Divider vertical />

                        <Button
                          appearance="link"
                          color="red"
                        //onClick={() => handleDeletaAttachment(attachment)}
                        >
                          <TrashIcon style={{ marginLeft: '10px', scale: '1.4' }} />
                        </Button>
                      </div>
                    )}
                  </Cell>
                </Column>
              </Table>
            </TabPanel>
          </Tabs>
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

      </Panel>

    </>
  );
};

export default EmployeeRegistration;