import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import DocPassIcon from '@rsuite/icons/DocPass';
import ChangeListIcon from '@rsuite/icons/ChangeList';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import ReloadIcon from '@rsuite/icons/Reload';
import SearchPatientCriteria from '@/components/SearchPatientCriteria';

import { addFilterToListRequest } from '@/utils';
import { DatePicker } from 'rsuite';

const { Column, HeaderCell, Cell } = Table;
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import { Block, Check } from '@rsuite/icons';
import { Modal, PanelGroup, Checkbox } from 'rsuite';
import React, { useEffect, useState } from 'react';
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
  useGetDepartmentsQuery,
  useGetFacilitiesQuery,
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery,
  useGetPractitionersQuery
} from '@/services/setupService';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { initialListRequest, ListRequest } from '@/types/types';
import {
  useGetEncountersQuery,
  useCompleteEncounterRegistrationMutation
} from '@/services/encounterService';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetPatientRelationsQuery,
  useGetPatientsQuery,
  useGetPatientAdministrativeWarningsQuery
} from '@/services/patientService';
import { newApPatientRelation } from '@/types/model-types-constructor';
import BackButton from '@/components/BackButton/BackButton';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import ReactDOMServer from 'react-dom/server';

const EncounterRegistration = () => {
  const encounter = useSelector((state: RootState) => state.patient.encounter);
  const patientSlice = useAppSelector(state => state.patient);
  const { pathname } = useLocation();

  const dispatch = useAppDispatch();
  // dispatch(setPatient(null));
  const navigate = useNavigate();
  const [openModelVisitNote, setOpenModelVisitNote] = React.useState(false);
  const [openModelPayment, setOpenModelPayment] = React.useState(false);
  const [openModelCompanionCard, setOpenModelCompanionCard] = React.useState(false);
  const [openModelAppointmentView, setOpenModelAppointmentView] = React.useState(false);
  const [localEncounter, setLocalEncounter] = useState({ ...newApEncounter, discharge: false });
  const [administrativeWarningsModalOpen, setAdministrativeWarningsModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [validationResult, setValidationResult] = useState({});
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [record, setRecord] = useState<any>({
    searchByField: 'fullName',
    patientName: ''
  });
  const [warningsAdmistritiveListRequest, setWarningsAdmistritiveListRequest] =
    useState<ListRequest>({
      ...initialListRequest,
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patientSlice.patient?.key || undefined
        },
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        }
      ]
    });

  const [saveEncounter, saveEncounterMutation] = useCompleteEncounterRegistrationMutation();

  /* load page LOV */
  const { data: encounterStatusLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_STATUS');
  const { data: encounterClassLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_CLASS');
  const { data: encounterPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
  const { data: encounterReasonLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_REASON');
  const { data: encounterTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_TYPE');
  const { data: serviceTypeLovQueryResponse } = useGetLovValuesByCodeQuery('SERVICE_TYPE');
  const { data: patientStatusLovQueryResponse } = useGetLovValuesByCodeQuery('PATIENT_STATUS');
  const { data: encounterBasedOnLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_BASED_ON');
  const { data: dietPreferenceLovQueryResponse } = useGetLovValuesByCodeQuery('DIET_PREF');
  const { data: specialArrangementLovQueryResponse } =
    useGetLovValuesByCodeQuery('ENC_SPECIAL_ARNG');
  const { data: specialCourtesyLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_SPECIAL_COURT');
  const { data: locationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('LOCATION_TYPE');
  const { data: paymentTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PAY_TYPS');
  const { data: paymentMethodLovQueryResponse } = useGetLovValuesByCodeQuery('PAY_METHOD');
  const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
  const { data: InsurancePlanTypeLovQueryResponse } = useGetLovValuesByCodeQuery('INS_PLAN_TYPS');
  const { data: InsuranceProviderLovQueryResponse } = useGetLovValuesByCodeQuery('INS_PROVIDER');
  const { data: payerTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PAYER_TYPE');
  const { data: patOriginLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_ORIGIN');
  const { data: relationsLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');
  const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
  const { data: bookingstatusLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_STATUS');
  const { data: practitionerListResponse } = useGetPractitionersQuery({ ...initialListRequest });
  const { data: facilityListResponse } = useGetFacilitiesQuery({ ...initialListRequest });
  const { data: departmentListResponse } = useGetDepartmentsQuery({ ...initialListRequest });
  const [selectedCriterion, setSelectedCriterion] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [patientSearchTarget, setPatientSearchTarget] = useState('primary');
  const [searchResultVisible, setSearchResultVisible] = useState(false);
  const { data: warnings, refetch: warningsRefetch } = useGetPatientAdministrativeWarningsQuery(
    warningsAdmistritiveListRequest
  );
  const {
    data: patientListResponse,
    isLoading: isGettingPatients,
    isFetching: isFetchingPatients,
    refetch: refetchPatients
  } = useGetPatientsQuery({
    ...listRequest,
    filters: [
      {
        fieldName: fromCamelCaseToDBName(selectedCriterion) || 'document_no',
        operator: 'containsIgnoreCase',
        value: searchKeyword || '-1'
      }
    ]
  });
  const [paymentMethodSelected, setPaymentMethodSelected] = useState(null);
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

  const initEncounterFromPatient = () => {
    if (patientSlice.patient) {
      setLocalEncounter({
        ...newApEncounter,
        patientKey: patientSlice.patient.key,
        patientFullName: patientSlice.patient.fullName,
        patientAge: patientSlice.patient.dob
          ? calculateAgeFormat(patientSlice.patient.dob) + ''
          : '',
        encounterStatusLkey: '91063195286200', //change this to be loaded from cache lov values by code
        plannedStartDate: new Date(),
        discharge: false
      });
    } else {
      console.warn('No patient found in state');
    }
  };

  // dispatch(setPatient(cachedPatient));
  useEffect(() => {
    if (!patientSlice.patient && !localEncounter.patientKey) {
      console.log('case1-no patient');
      dispatch(setPatient({ ...newApPatient }));
      dispatch(setEncounter({ ...newApEncounter, discharge: false }));
      // navigate('/patient-profile');
    } else {
      console.log('case2 patient');
      setEditing(true);
      initEncounterFromPatient();
    }
    setWarningsAdmistritiveListRequest({
      ...initialListRequest,
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patientSlice.patient?.key || undefined
        },
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        }
      ]
    });
  }, [patientSlice.patient]);

  const handleCancel = () => {
    dispatch(setPatient(null));
    dispatch(setEncounter(null));
    setLocalEncounter({ ...newApEncounter, discharge: false });
    // navigate('/patient-profile');
  };
  const handleGoToPatientAppointment = () => {
    navigate('/patient-appointment-view');
  };
  const handleGoBack = () => {
    navigate(-1);
  };
  const handleOpenCompanionCardModel = () => setOpenModelCompanionCard(true);
  const handleCloseCompanionCardModel = () => setOpenModelCompanionCard(false);
  const handleSaveCompanionCard = () => {
    //add logic to cave note
    setOpenModelCompanionCard(false);
  };
  const handleOpenNoteModel = () => setOpenModelVisitNote(true);
  const handleCloseNoteModel = () => setOpenModelVisitNote(false);
  const handleSaveNote = () => {
    console.log(localEncounter.encounterNotes);
    setOpenModelVisitNote(false);
  };
  const handleOpenPaymentModel = () => setOpenModelPayment(true);
  const handleClosePaymentModel = () => setOpenModelPayment(false);
  const handleSavePayment = () => {
    //add logic to cave note
    setOpenModelPayment(false);
  };
  const handleOpenAppointmentViewModel = () => setOpenModelAppointmentView(true);
  const handleCloseAppointmentViewModel = () => setOpenModelAppointmentView(false);
  const handleSave = () => {
    if (localEncounter && localEncounter.patientKey) {
      saveEncounter(localEncounter).unwrap();
    } else {
      dispatch(notify({ msg: 'encounter not linked to patient', sev: 'error' }));
    }
  };

  useEffect(() => {
    if (saveEncounterMutation && saveEncounterMutation.status === 'fulfilled') {
      setLocalEncounter(saveEncounterMutation.data);
      dispatch(setEncounter(saveEncounterMutation.data));
      // setEditing(false);
      setValidationResult(undefined);
      dispatch(notify('Encounter Saved!'));
    } else if (saveEncounterMutation && saveEncounterMutation.status === 'rejected') {
      setValidationResult(saveEncounterMutation.error.data.validationResult);
    }
  }, [saveEncounterMutation]);

  const handleChangePatient = () => {
    setEditing(true);
    dispatch(setPatient(null));
    dispatch(setEncounter(null));
    setLocalEncounter({ ...newApEncounter, discharge: false });
    navigate('/patient-profile');
  };

  const [selectedPatientRelation, setSelectedPatientRelation] = useState<any>({
    ...newApPatientRelation
  });
  const handleSelectPatient = data => {
    if (patientSearchTarget === 'primary') {
      // selecteing primary patient (localPatient)
      console.log(data);
      dispatch(setPatient(data));

      setLocalEncounter({
        ...newApEncounter,
        patientKey: patientSlice.patient.key,
        patientFullName: patientSlice.patient.fullName,
        patientAge: patientSlice.patient.dob
          ? calculateAgeFormat(patientSlice.patient.dob) + ''
          : '',
        encounterStatusLkey: '91063195286200', //change this to be loaded from cache lov values by code
        plannedStartDate: new Date(),
        discharge: false
      });
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
    if (searchKeyword !== '' && searchKeyword.length >= 3 && selectedCriterion) {
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
    console.log('kw' + searchKeyword);
    console.log('PatientSearchTarget' + patientListResponse?.object);
    console.log(listRequest);
  };

  useEffect(() => {}, [paymentMethodSelected]);
  useEffect(() => {}, [searchKeyword]);

  useEffect(() => {
    setSelectedCriterion(record?.searchByField);
    setSearchKeyword(record?.patientName);
  }, [record]);

  useEffect(() => {
    const header = (
      "Patient Registration"
    );
    dispatch(setPageCode('Patient_Registration'));
    dispatch(setDivContent(header));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, pathname]);

  const handleSearch = () => {
    const searchBy = record?.searchByField;
    const keyword = record?.patientName;

    if (!keyword) return;

    search({ searchBy, keyword });
  };

  console.log('searchByField:', record.searchByField);
  console.log('patientName:', record.patientName);

  const conjurePatientSearchBar = target => {
    return (
      <Panel>
        <ButtonToolbar>
          <Form fluid layout="inline">
            <SearchPatientCriteria
              record={record}
              setRecord={setRecord}
              onSearchClick={handleSearch}
            />
          </Form>
        </ButtonToolbar>
      </Panel>
    );
  };
  const handleFilterChangeInWarning = (fieldName, value) => {
    if (value) {
      setWarningsAdmistritiveListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          String(value),
          warningsAdmistritiveListRequest
        )
      );
    } else {
      setWarningsAdmistritiveListRequest({
        ...warningsAdmistritiveListRequest,
        filters: [
          {
            fieldName: 'patient_key',
            operator: 'match',
            value: localPatient.key || undefined
          },
          {
            fieldName: 'deleted_at',
            operator: 'isNull',
            value: undefined
          }
        ]
      });
    }
  };
  return (
    <>
      {patientSlice.patient && (
        <Panel
          header={
            <h3 className="title">
              <Translate>{encounter ? ' Quick Appointment' : 'New Quick Appointment'}</Translate>
            </h3>
          }
        >
          <Panel bordered>
            <ButtonToolbar>
              <BackButton onClick={handleGoBack} />
              <IconButton appearance="primary" color="blue" icon={<Block />} onClick={handleCancel}>
                <Translate>Cancel</Translate>
              </IconButton>
              <IconButton appearance="primary" color="violet" icon={<Check />} onClick={handleSave}>
                <Translate>Save</Translate>
              </IconButton>
              <Divider vertical />
              <IconButton
                appearance="primary"
                color="orange"
                icon={<icons.Danger />}
                onClick={() => {
                  setAdministrativeWarningsModalOpen(true);
                }}
              >
                <Translate>Administrative Warnings</Translate>
              </IconButton>
              <IconButton
                appearance="primary"
                color="cyan"
                onClick={() => handleOpenAppointmentViewModel()}
                icon={<ChangeListIcon />}
              >
                <Translate>Patient Appointment</Translate>
              </IconButton>

              <IconButton
                onClick={() => handleOpenNoteModel()}
                appearance="primary"
                color="cyan"
                icon={<icons.PublicOpinion />}
              >
                <Translate>Visit Note</Translate>
              </IconButton>
              <IconButton
                appearance="ghost"
                color="violet"
                icon={<icons.Reload />}
                onClick={handleChangePatient}
              >
                <Translate>Change Patient</Translate>
              </IconButton>
            </ButtonToolbar>
            <Modal open={openModelVisitNote} onClose={handleCloseNoteModel}>
              <Modal.Header>
                <Modal.Title>Visit Note</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form layout="inline" fluid>
                  <MyInput
                    width={250}
                    column
                    disabled={false}
                    fieldType="textarea"
                    fieldLabel="Note"
                    fieldName={'encounterNotes'}
                    setRecord={setLocalEncounter}
                    record={localEncounter}
                  />
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={handleSaveNote} appearance="primary">
                  Save
                </Button>
                <Button onClick={handleCloseNoteModel} appearance="subtle">
                  Cancle
                </Button>
              </Modal.Footer>
            </Modal>
            <Modal open={openModelPayment} onClose={handleClosePaymentModel} size="lg">
              <Modal.Header>
                <Modal.Title>Payment</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form layout="inline" fluid>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MyInput
                      vr={validationResult}
                      column
                      width={180}
                      fieldType="select"
                      fieldName="PaymentMethod"
                      selectData={paymentMethodLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={{}}
                      setRecord={newValue => {
                        console.log('Selected Payment Method:', newValue.PaymentMethod);
                        setPaymentMethodSelected(newValue.PaymentMethod);
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        marginTop: '5px'
                      }}
                    >
                      <MyInput
                        column
                        width={180}
                        fieldLabel="Amount"
                        fieldName={'Amount'}
                        record={{}}
                        setRecord={''}
                      />
                      <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          id="addFreeBalance"
                          name="addFreeBalance"
                          style={{ marginRight: '8px' }}
                        />
                        <label htmlFor="addFreeBalance" style={{ fontSize: '12px' }}>
                          Add to Free Balance
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <p>refresh</p>
                      <IconButton size="xs" icon={<ReloadIcon />} appearance="ghost" />
                    </div>
                    <MyInput
                      vr={validationResult}
                      width={180}
                      column
                      fieldType="select"
                      fieldName="Currency"
                      selectData={currencyLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={{}}
                      setRecord={''}
                    />
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        paddingTop: '20px'
                      }}
                    >
                      <Button
                        appearance="ghost"
                        style={{
                          border: '1px solid rgb(130, 95, 196)',
                          color: 'rgb(130, 95, 196)'
                        }}
                      >
                        <FontAwesomeIcon icon={faBolt} style={{ marginRight: '8px' }} />
                        <span>Exchange Rate</span>
                      </Button>
                    </div>
                  </div>
                  {paymentMethodSelected === '3623962430163299' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MyInput
                        column
                        width={180}
                        fieldName={'CardNumber'}
                        record={{}}
                        setRecord={''}
                      />
                      <MyInput
                        column
                        width={180}
                        fieldName={'HolderName'}
                        record={{}}
                        setRecord={''}
                      />

                      <MyInput
                        column
                        fieldType="date"
                        fieldName="ValidUntil"
                        record={{}}
                        setRecord={''}
                      />
                    </div>
                  )}
                  {paymentMethodSelected === '3623993823412902' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MyInput
                        column
                        width={180}
                        fieldName={'ChequeNumber'}
                        record={{}}
                        setRecord={''}
                      />
                      <MyInput
                        column
                        width={180}
                        fieldName={'BankName'}
                        record={{}}
                        setRecord={''}
                      />

                      <MyInput
                        column
                        fieldType="date"
                        fieldName="ChequeDueDate"
                        record={{}}
                        setRecord={''}
                      />
                    </div>
                  )}
                  {paymentMethodSelected === '91849731565300' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MyInput
                        column
                        width={180}
                        fieldName={'transferNumber'}
                        record={{}}
                        setRecord={''}
                      />
                      <MyInput
                        column
                        width={180}
                        fieldName={'BankName'}
                        record={{}}
                        setRecord={''}
                      />

                      <MyInput
                        column
                        fieldType="date"
                        fieldName="transferDate"
                        record={{}}
                        setRecord={''}
                      />
                    </div>
                  )}
                  <div style={{ width: '100%', display: 'flex', gap: '10px' }}>
                    <div style={{ border: '1px solid #b6b7b8', flex: '2', borderRadius: '5px' }}>
                      <Table
                        style={{ maxHeight: 200, overflowY: 'auto' }}
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
                        headerHeight={50}
                        rowHeight={50}
                        bordered
                        cellBordered
                        // onRowClick={rowData => {
                        //   handleSelectPatient(rowData);
                        //   setSearchKeyword(null);
                        // }}
                        data={[]}
                      >
                        <Column flexGrow={1}>
                          <HeaderCell>
                            <Checkbox
                            // checked={selectAll}
                            // onChange={handleSelectAll}
                            />
                          </HeaderCell>
                          <Cell>
                            {rowData => (
                              <Checkbox
                              // checked={selectedRows.includes(rowData)}
                              // onChange={() => handleRowSelection(rowData)}
                              />
                            )}
                          </Cell>
                        </Column>
                        <Column flexGrow={4}>
                          <HeaderCell>
                            <Translate>Service Name</Translate>
                          </HeaderCell>
                          <Cell dataKey="ServiceName" />
                        </Column>
                        <Column flexGrow={1}>
                          <HeaderCell>
                            <Translate>Type</Translate>
                          </HeaderCell>
                          <Cell dataKey="Type" />
                        </Column>
                        <Column flexGrow={3}>
                          <HeaderCell>
                            <Translate>Quantity</Translate>
                          </HeaderCell>
                          <Cell dataKey="Quantity" />
                        </Column>
                        <Column flexGrow={2}>
                          <HeaderCell>
                            <Translate>Price</Translate>
                          </HeaderCell>
                          <Cell dataKey="Price" />
                        </Column>
                        <Column flexGrow={3}>
                          <HeaderCell>
                            <Translate>Currency</Translate>
                          </HeaderCell>
                          <Cell dataKey="Currency" />
                        </Column>
                      </Table>
                    </div>
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                      <MyInput
                        column
                        disabled={true}
                        width={180}
                        fieldName={'DueAmount'}
                        record={{}}
                        setRecord={''}
                      />
                      <MyInput
                        column
                        disabled={true}
                        width={180}
                        fieldName={'Patient`s free Balance'}
                        record={{}}
                        setRecord={''}
                      />
                    </div>
                  </div>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={handleSavePayment} appearance="primary">
                  Save
                </Button>
                <Button onClick={handleClosePaymentModel} appearance="subtle">
                  Cancle
                </Button>
              </Modal.Footer>
            </Modal>
          </Panel>
          <br />
          <Panel bordered>{conjurePatientSearchBar('primary')}</Panel>
          <br />
          <Panel
            bordered
            header={
              <h5 className="title">
                <Translate>Patient Information</Translate>
              </h5>
            }
          >
            <Stack>
              <Stack.Item grow={4}>
                <Form layout="inline" fluid>
                  <MyInput
                    width={130}
                    column
                    disabled={true}
                    fieldLabel="MRN"
                    fieldName={'patientMrn'}
                    record={patientSlice.patient}
                    setRecord={undefined}
                  />
                  <MyInput
                    column
                    width={130}
                    disabled={true}
                    fieldName={'fullName'}
                    record={patientSlice.patient}
                    setRecord={undefined}
                  />
                  <MyInput
                    width={130}
                    column
                    disabled={true}
                    fieldName={'documentNo'}
                    record={patientSlice.patient}
                    setRecord={undefined}
                  />

                  <MyInput
                    width={130}
                    vr={validationResult}
                    column
                    fieldLabel="Document Type"
                    fieldType="select"
                    fieldName="documentTypeLkey"
                    selectData={docTypeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={patientSlice.patient}
                    setRecord={undefined}
                    disabled={true}
                  />
                  <MyInput
                    width={130}
                    column
                    disabled={true}
                    fieldName={'patientAge'}
                    record={localEncounter}
                    setRecord={undefined}
                  />
                  <MyInput
                    width={130}
                    column
                    disabled={true}
                    fieldLabel="Gender"
                    fieldName={patientSlice.patient.genderLvalue ? 'lovDisplayVale' : 'genderLkey'}
                    record={
                      patientSlice.patient.genderLvalue
                        ? patientSlice.patient.genderLvalue
                        : patientSlice.patient
                    }
                    setRecord={undefined}
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
                <Translate>Main Visit Details</Translate>
              </h5>
            }
          >
            <Stack>
              <Stack.Item grow={4}>
                <Form layout="inline" fluid>
                  <MyInput
                    vr={validationResult}
                    column
                    disabled={true}
                    fieldLabel="Visit ID"
                    fieldName="visitId"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={true}
                    fieldLabel="Date"
                    fieldType="date"
                    fieldName="plannedStartDate"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    fieldType="select"
                    fieldLabel="Visit Type"
                    fieldName="encounterTypeLkey"
                    selectData={encounterTypeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  <MyInput
                    vr={validationResult}
                    column
                    fieldType="select"
                    fieldName="departmentKey"
                    selectData={departmentListResponse?.object ?? []}
                    selectDataLabel="name"
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    fieldType="select"
                    fieldLabel="Physician"
                    fieldName="physicianKey"
                    selectData={practitionerListResponse?.object ?? []}
                    selectDataLabel="practitionerFullName"
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    fieldType="select"
                    fieldLabel="Priority"
                    fieldName="encounterPriorityLkey"
                    selectData={encounterPriorityLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  <br />
                  <MyInput
                    vr={validationResult}
                    column
                    fieldType="select"
                    fieldName="reasonLkey"
                    selectData={encounterReasonLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  <MyInput
                    vr={validationResult}
                    column
                    fieldType="select"
                    fieldName="admissionOrigin"
                    selectData={patOriginLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  <MyInput
                    vr={validationResult}
                    column
                    fieldLabel="Source Name"
                    fieldName="sourceName"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  {/* <MyInput
                    vr={validationResult}
                    column
                    disabled={true}
                    fieldLabel="Booking Status"
                    fieldName="encounterStatusLkey"
                    record={encounter ? encounter : localEncounter}
                    setRecord={setLocalEncounter}
                  /> */}
                  <MyInput
                    vr={validationResult}
                    column
                    fieldLabel="Booking Status"
                    fieldType="select"
                    fieldName="encounterStatusLkey"
                    selectData={bookingstatusLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                    disabled={true}
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
                <Translate>Payment Detail</Translate>
              </h5>
            }
          >
            <Stack>
              <Stack.Item grow={4}>
                <Form layout="inline" fluid>
                  <MyInput
                    vr={validationResult}
                    column
                    disabled={true}
                    fieldName="PatientBalance"
                    selectData={[]}
                    selectDataLabel=""
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  <MyInput
                    vr={validationResult}
                    column
                    disabled={true}
                    fieldName="Fees"
                    selectData={[]}
                    selectDataLabel=""
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  <MyInput
                    vr={validationResult}
                    column
                    fieldType="select"
                    fieldName="paymentTypeLkey"
                    selectData={paymentTypeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="select"
                    fieldName="InsuranceProvider"
                    selectData={InsuranceProviderLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={true}
                    fieldName="InsurancePolicyNumber"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={true}
                    fieldName="GroupNumber"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={true}
                    fieldType="select"
                    fieldName="InsurancePlanType"
                    selectData={InsurancePlanTypeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />

                  <MyInput
                    vr={validationResult}
                    column
                    disabled={true}
                    fieldName="Authorization Numbers"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  <MyInput
                    vr={validationResult}
                    column
                    fieldType="date"
                    disabled={true}
                    fieldName="Expiration Date"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  <div>
                    <IconButton
                      onClick={() => handleOpenPaymentModel()}
                      appearance="primary"
                      color="cyan"
                      icon={<AddOutlineIcon />}
                    >
                      <Translate>Add payment</Translate>
                    </IconButton>
                  </div>
                </Form>
              </Stack.Item>
            </Stack>
          </Panel>
          <br />
          <Panel
            bordered
            header={
              <h5 className="title">
                <Translate>Print Reports</Translate>
              </h5>
            }
          >
            <ButtonToolbar>
              <IconButton appearance="primary" color="cyan" icon={<DocPassIcon />}>
                <Translate>Patient wrist band</Translate>
              </IconButton>

              <Divider vertical />

              <IconButton
                disabled={encounter}
                appearance="primary"
                color="violet"
                icon={<DocPassIcon />}
              >
                <Translate>Patient label</Translate>
              </IconButton>

              <Divider vertical />

              <IconButton appearance="primary" color="cyan" icon={<DocPassIcon />}>
                <Translate>Appointment Card</Translate>
              </IconButton>

              <Divider vertical />
              <IconButton
                disabled={encounter}
                appearance="primary"
                color="violet"
                icon={<DocPassIcon />}
              >
                <Translate>Visit Clinical Report</Translate>
              </IconButton>

              <Divider vertical />

              <IconButton appearance="primary" color="cyan" icon={<DocPassIcon />}>
                <Translate>Visit Finance Report</Translate>
              </IconButton>

              <Divider vertical />

              <IconButton
                disabled={encounter}
                appearance="primary"
                color="violet"
                icon={<DocPassIcon />}
                onClick={handleOpenCompanionCardModel}
              >
                <Translate>Companion Card</Translate>
              </IconButton>
            </ButtonToolbar>
            <Modal open={openModelCompanionCard} onClose={handleCloseCompanionCardModel}>
              <Modal.Header>
                <Modal.Title>Companion Card</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form layout="inline" fluid>
                  <MyInput
                    width={250}
                    column
                    disabled={false}
                    fieldLabel="Companion Name"
                    fieldName={'VisitNote'}
                    setRecord={setLocalEncounter}
                    vr={validationResult}
                    record={encounter ? encounter : localEncounter}
                  />
                  <br />
                  <MyInput
                    width={250}
                    column
                    disabled={false}
                    fieldType="number"
                    fieldLabel="Phone Number"
                    fieldName={'Visitname'}
                    setRecord={setLocalEncounter}
                    vr={validationResult}
                    record={encounter ? encounter : localEncounter}
                  />
                  <br />
                  {
                    //relation
                  }
                  <MyInput
                    vr={validationResult}
                    column
                    disabled={!editing || encounter}
                    fieldType="select"
                    fieldLabel="Relation"
                    fieldName="relationTypeLkey"
                    selectData={relationsLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={encounter ? encounter : localEncounter}
                    setRecord={setLocalEncounter}
                  />
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={handleSaveCompanionCard} appearance="primary">
                  Save
                </Button>
                <Button onClick={handleCloseCompanionCardModel} appearance="subtle">
                  Cancle
                </Button>
              </Modal.Footer>
            </Modal>
            <Modal
              open={openModelAppointmentView}
              style={{ width: '90%', marginLeft: '80px' }}
              onClose={handleCloseAppointmentViewModel}
            >
              <Modal.Header>
                <Modal.Title>Patient's Appointment</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div style={{ padding: '10px', height: '100%' }}>
                  <PanelGroup>
                    {/* First Panel with a title on the border */}
                    <fieldset style={{ border: '2px solid #a0a3a8', marginBottom: '10px' }}>
                      <legend style={{ padding: '10px', fontWeight: 'bold', fontSize: '20px' }}>
                        Search
                      </legend>
                      <Panel style={{ height: '130px', display: 'flex', alignItems: 'center' }}>
                        <label
                          htmlFor="fromDate"
                          style={{ margin: '0 5px', fontWeight: 'bold', fontSize: '17px' }}
                        >
                          From Date
                        </label>
                        <DatePicker id="fromDate" style={{ width: '240px' }} format="MM/dd/yyyy" />

                        <label
                          htmlFor="toDate"
                          style={{ margin: '0 5px', fontWeight: 'bold', fontSize: '17px' }}
                        >
                          To Date
                        </label>
                        <DatePicker id="toDate" style={{ width: '240px' }} format="MM/dd/yyyy" />
                      </Panel>
                    </fieldset>

                    {/* Second Panel with a title on the border */}
                    <fieldset style={{ border: '2px solid #a0a3a8', marginBottom: '10px' }}>
                      <legend style={{ padding: '10px', fontWeight: 'bold', fontSize: '20px' }}>
                        Patient's Appointment
                      </legend>
                      <Panel>
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
                          rowHeight={60}
                          bordered
                          cellBordered
                          data={[]}
                        >
                          <Column sortable flexGrow={4}>
                            <HeaderCell>
                              <Input onChange={e => handleFilterChange('AppointmentDate', e)} />
                              <Translate>Appointment Date</Translate>
                            </HeaderCell>
                            <Cell dataKey="AppointmentDate " />
                          </Column>

                          <Column sortable flexGrow={3}>
                            <HeaderCell align="center">
                              <Input onChange={e => handleFilterChange('Status', e)} />
                              <Translate>Status</Translate>
                            </HeaderCell>
                            <Cell dataKey="Status" />
                          </Column>

                          <Column sortable flexGrow={4}>
                            <HeaderCell>
                              <Input onChange={e => handleFilterChange('Department', e)} />
                              <Translate>Department</Translate>
                            </HeaderCell>
                            <Cell dataKey="Department" />
                          </Column>
                          <Column sortable flexGrow={4}>
                            <HeaderCell>
                              <Input onChange={e => handleFilterChange('Physician', e)} />
                              <Translate>Physician</Translate>
                            </HeaderCell>
                            <Cell dataKey="Physician" />
                          </Column>

                          <Column sortable flexGrow={4}>
                            <HeaderCell>
                              <Input onChange={e => handleFilterChange('BookingSource', e)} />
                              <Translate>Booking Source</Translate>
                            </HeaderCell>
                            <Cell dataKey="BookingSource" />
                          </Column>
                          <Column sortable flexGrow={4}>
                            <HeaderCell>
                              <Input onChange={e => handleFilterChange('Follow-up', e)} />
                              <Translate>Follow-up</Translate>
                            </HeaderCell>
                            <Cell dataKey="Follow-up" />
                          </Column>
                          <Column sortable flexGrow={4}>
                            <HeaderCell>
                              <Input onChange={e => handleFilterChange('Bookingdate', e)} />
                              <Translate>Booking date</Translate>
                            </HeaderCell>
                            <Cell dataKey="Bookingdate" />
                          </Column>
                          <Column sortable flexGrow={4}>
                            <HeaderCell>
                              <Input onChange={e => handleFilterChange('CompleteDate', e)} />
                              <Translate>Complete Date</Translate>
                            </HeaderCell>
                            <Cell dataKey="CompleteDate" />
                          </Column>
                          <Column sortable flexGrow={4}>
                            <HeaderCell>
                              <Input onChange={e => handleFilterChange('CancelDate', e)} />
                              <Translate>Cancel Date </Translate>
                            </HeaderCell>
                            <Cell dataKey="CancelDate" />
                          </Column>
                          <Column sortable flexGrow={4}>
                            <HeaderCell>
                              <Input onChange={e => handleFilterChange('CancellationReason', e)} />
                              <Translate>Cancellation Reason</Translate>
                            </HeaderCell>
                            <Cell dataKey="CancellationReason" />
                          </Column>
                          <Column sortable flexGrow={4}>
                            <HeaderCell>
                              <Input onChange={e => handleFilterChange('BookedBy', e)} />
                              <Translate>Booked By</Translate>
                            </HeaderCell>
                            <Cell dataKey="BookedBy" />
                          </Column>
                          <Column sortable flexGrow={4}>
                            <HeaderCell>
                              <Input onChange={e => handleFilterChange('CancelledBy ', e)} />
                              <Translate>Cancelled By </Translate>
                            </HeaderCell>
                            <Cell dataKey="CancelledBy " />
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
                            total={1}
                          />
                        </div>
                      </Panel>
                    </fieldset>
                  </PanelGroup>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  style={{ padding: '5px', marginTop: '10px', fontSize: '16px' }}
                  onClick={handleCloseAppointmentViewModel}
                  appearance="subtle"
                >
                  Cancle
                </Button>
              </Modal.Footer>
            </Modal>
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
                  rowHeight={60}
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
          </Panel>
          <Modal
            size="lg"
            open={administrativeWarningsModalOpen}
            onClose={() => setAdministrativeWarningsModalOpen(false)}
          >
            <Modal.Header>
              <Modal.Title>Administrative Warnings</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Panel>
                <Table
                  height={310}
                  sortColumn={warningsAdmistritiveListRequest.sortBy}
                  sortType={warningsAdmistritiveListRequest.sortType}
                  onSortColumn={(sortBy, sortType) => {
                    if (sortBy)
                      setWarningsAdmistritiveListRequest({
                        ...warningsAdmistritiveListRequest,
                        sortBy,
                        sortType
                      });
                  }}
                  headerHeight={80}
                  rowHeight={50}
                  bordered
                  cellBordered
                  // onRowClick={rowData => {
                  //   setSelectedPatientAdministrativeWarnings(rowData);
                  //   setSelectedRowId(rowData.key);
                  // }}
                  // rowClassName={isSelected}
                  data={warnings?.object ?? []}
                >
                  <Column sortable flexGrow={3} fullText>
                    <HeaderCell>
                      <Input
                        onChange={e =>
                          handleFilterChangeInWarning('warningTypeLvalue.lovDisplayVale', e)
                        }
                      />
                      <Translate>Warning Type</Translate>
                    </HeaderCell>

                    <Cell dataKey="warningTypeLvalue.lovDisplayVale" />
                  </Column>
                  <Column sortable flexGrow={3} fullText>
                    <HeaderCell>
                      <Input onChange={e => handleFilterChangeInWarning('description', e)} />
                      <Translate>Description</Translate>
                    </HeaderCell>
                    <Cell dataKey="description" />
                  </Column>
                  <Column sortable flexGrow={4} fullText>
                    <HeaderCell>
                      <Input onChange={e => handleFilterChangeInWarning('createdAt', e)} />
                      <Translate> Addition Date</Translate>
                    </HeaderCell>

                    <Cell>
                      {rowData =>
                        rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ''
                      }
                    </Cell>
                  </Column>
                  <Column sortable flexGrow={3} fullText>
                    <HeaderCell>
                      <Input onChange={e => handleFilterChangeInWarning('createdBy', e)} />
                      <Translate> Added By</Translate>
                    </HeaderCell>
                    <Cell dataKey="createdBy" />
                  </Column>
                  <Column sortable flexGrow={3} fullText>
                    <HeaderCell>
                      <Translate> Status </Translate>
                    </HeaderCell>

                    <Cell dataKey="isValid">
                      {rowData => (rowData.isValid ? 'Active' : 'Resolved')}
                    </Cell>
                  </Column>
                  <Column sortable flexGrow={4} fullText>
                    <HeaderCell>
                      <Input onChange={e => handleFilterChangeInWarning('dateResolved', e)} />
                      <Translate> Resolution Date</Translate>
                    </HeaderCell>
                    <Cell dataKey="dateResolved" />
                  </Column>
                  <Column sortable flexGrow={3} fullText>
                    <HeaderCell>
                      <Input onChange={e => handleFilterChangeInWarning('resolvedBy', e)} />
                      <Translate> Resolved By </Translate>
                    </HeaderCell>
                    <Cell dataKey="resolvedBy" />
                  </Column>
                  <Column sortable flexGrow={4} fullText>
                    <HeaderCell>
                      <Input onChange={e => handleFilterChangeInWarning('resolutionUndoDate', e)} />
                      <Translate> Resolution Undo Date</Translate>
                    </HeaderCell>
                    <Cell dataKey="resolutionUndoDate" />
                  </Column>
                  <Column sortable flexGrow={4} fullText>
                    <HeaderCell>
                      <Input onChange={e => handleFilterChangeInWarning('resolvedUndoBy', e)} />
                      <Translate>Resolution Undo By</Translate>
                    </HeaderCell>
                    <Cell dataKey="resolvedUndoBy" />
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
                    limit={warningsAdmistritiveListRequest.pageSize}
                    activePage={warningsAdmistritiveListRequest.pageNumber}
                    onChangePage={pageNumber => {
                      setWarningsAdmistritiveListRequest({
                        ...warningsAdmistritiveListRequest,
                        pageNumber
                      });
                    }}
                    onChangeLimit={pageSize => {
                      setWarningsAdmistritiveListRequest({
                        ...warningsAdmistritiveListRequest,
                        pageSize
                      });
                    }}
                    total={warnings?.extraNumeric ?? 0}
                  />
                </div>
              </Panel>
            </Modal.Body>
          </Modal>
        </Panel>
      )}
    </>
  );
};

export default EncounterRegistration;
