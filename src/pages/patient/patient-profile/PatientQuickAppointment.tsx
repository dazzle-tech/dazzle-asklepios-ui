import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';

import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { ApPatient ,ApPatientInsurance} from '@/types/model-types';
import DocPassIcon from '@rsuite/icons/DocPass';
import ChangeListIcon from '@rsuite/icons/ChangeList';
import ArowBackIcon from '@rsuite/icons/ArowBack';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import ReloadIcon from '@rsuite/icons/Reload';

import {
    addFilterToListRequest,
    conjureValueBasedOnKeyFromList,

} from '@/utils';
import {
    useGetUsersQuery
} from '@/services/setupService';
import { DatePicker } from 'rsuite';

const { Column, HeaderCell, Cell } = Table;
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import { Block, Check, DocPass, Edit, Icon, PlusRound } from '@rsuite/icons';
import { Modal, Placeholder, PanelGroup, Checkbox } from 'rsuite';
import React, { useEffect, useState } from 'react';
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
import {
    useGetPatientInsuranceQuery,
    
} from '@/services/patientService';
import * as icons from '@rsuite/icons';
import { calculateAgeFormat, fromCamelCaseToDBName } from '@/utils';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    useGetDepartmentsQuery,
    useGetFacilitiesQuery,
    useGetLovValuesByCodeAndParentQuery,
    useGetLovValuesByCodeQuery,
    useGetPractitionersQuery,

} from '@/services/setupService';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
import {
    newApPatientInsurance,
    newApPatientRelation
} from '@/types/model-types-constructor';
import MyLabel from '@/components/MyLabel';
const PatientQuickAppointment = ({quickAppointmentModel ,localPatient,setQuickAppointmentModel}) => {
    const [openQuickAppointmentModel, setOpenQuickAppointmentModel] = useState(quickAppointmentModel);
    const encounter = useSelector((state: RootState) => state.patient.encounter);
    const patientSlice = useAppSelector(state => state.patient);
    const [patientInsurance, setPatientInsurance] = useState<ApPatientInsurance>({ ...newApPatientInsurance });
    const dispatch = useAppDispatch();
    // dispatch(setPatient(null));
    const navigate = useNavigate();
    const [openModelVisitNote, setOpenModelVisitNote] = React.useState(false);
    const [openModelPayment, setOpenModelPayment] = React.useState(false);
    const [openModelCompanionCard, setOpenModelCompanionCard] = React.useState(false);
    const [openModelAppointmentView, setOpenModelAppointmentView] = React.useState(false);
    const [localEncounter, setLocalEncounter] = useState({ ...newApEncounter });
    const [administrativeWarningsModalOpen, setAdministrativeWarningsModalOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [validationResult, setValidationResult] = useState({});
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
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


         const{data: patientInsuranceResponse }= useGetPatientInsuranceQuery(
            {
               
                patientKey: localPatient?.key
            },
            { skip: !localPatient.key }
            );
            console.log(" localPatient?.key-->", localPatient?.key);
        console.log("patientInsurenceResponse-->",patientInsuranceResponse);
    /* load page LOV */
    const data = (patientInsuranceResponse ?? []).map(item => ({
        label: item.insuranceProvider,
        value: item.key,
        patientInsurance:item
      }));
    const { data: encounterPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
    const { data: encounterReasonLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_REASON');
    const { data: visitTypeLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');
    const { data: encounterTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_TYPE');
    const { data: paymentTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PAY_TYPS');
    const { data: paymentMethodLovQueryResponse } = useGetLovValuesByCodeQuery('PAY_METHOD');
    const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
    const { data: InsurancePlanTypeLovQueryResponse } = useGetLovValuesByCodeQuery('INS_PLAN_TYPS');
    const { data: InsuranceProviderLovQueryResponse } = useGetLovValuesByCodeQuery('INS_PROVIDER');
    const { data: patOriginLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_ORIGIN');
    const { data: practitionerListResponse } = useGetPractitionersQuery({ ...initialListRequest });
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
        ...listRequest, filters: [
            {
                fieldName: fromCamelCaseToDBName(selectedCriterion) || "document_no",
                operator: 'containsIgnoreCase',
                value: searchKeyword || "-1",
            },

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
                patientAge: patientSlice.patient.dob ? calculateAgeFormat(patientSlice.patient.dob) + '' : '',
                encounterStatusLkey: '91063195286200',//change this to be loaded from cache lov values by code
                plannedStartDate: new Date()
            });
        } else {
            console.warn('No patient found in state');
        }
    }
    console.log("localEncounter-->", localEncounter);
    // dispatch(setPatient(cachedPatient));
    useEffect(() => {
        if (!patientSlice.patient && !localEncounter.patientKey) {
            console.log("case1-no patient");
            dispatch(setPatient({ ...newApPatient }));
            dispatch(setEncounter({ ...newApEncounter }));
            // navigate('/patient-profile');
        } else {
            console.log("case2 patient");
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
        })
    }, [patientSlice.patient]);


    const handleCancel = () => {
        dispatch(setPatient(null));
        dispatch(setEncounter(null));
        setLocalEncounter({ ...newApEncounter });
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
        console.log(localEncounter.encounterNotes)
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
        setLocalEncounter({ ...newApEncounter });
        navigate('/patient-profile');
    };
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
    const handleSelectPatient = data => {
        if (patientSearchTarget === 'primary') {
            // selecteing primary patient (localPatient)
            console.log(data);
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
        console.log("kw" + searchKeyword);
        console.log("PatientSearchTarget" + patientListResponse?.object);
        console.log(listRequest);

    };

    useEffect(() => {

    }, [paymentMethodSelected]);
    useEffect(() => {


    }, [searchKeyword]);
console.log("patient Inc--->");
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
                ...warningsAdmistritiveListRequest, filters: [
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
            <Panel>
                <Modal open={quickAppointmentModel} onClose={() => { setQuickAppointmentModel(false); }} size="lg">
                    <Modal.Header>
                        <Modal.Title>Quick Appointment</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>

                        <Panel

                        >
                            <Panel bordered>
                                <ButtonToolbar>
                                    <IconButton

                                        appearance="primary"
                                        color="violet"
                                        icon={<Check />}
                                        onClick={handleSave}
                                    >
                                        <Translate>Save</Translate>
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
                                                fieldType='textarea'
                                                fieldLabel="Note"
                                                fieldName='encounterNotes'
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
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                                                    setRecord={(newValue) => {
                                                        console.log("Selected Payment Method:", newValue.PaymentMethod);
                                                        setPaymentMethodSelected(newValue.PaymentMethod);
                                                    }}
                                                />
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "5px" }}>
                                                    <MyInput
                                                        column
                                                        width={180}
                                                        fieldLabel="Amount"
                                                        fieldName={'Amount'}
                                                        record={{}}
                                                        setRecord={""}
                                                    />
                                                    <div style={{ marginTop: "5px", display: "flex", alignItems: "center" }}>
                                                        <input
                                                            type="checkbox"
                                                            id="addFreeBalance"
                                                            name="addFreeBalance"
                                                            style={{ marginRight: "8px" }}
                                                        />
                                                        <label htmlFor="addFreeBalance" style={{ fontSize: "12px" }}>
                                                            Add to Free Balance
                                                        </label>
                                                    </div>
                                                </div>

                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
                                                    setRecord={""}
                                                />
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "20px" }}>
                                                    <Button
                                                        appearance="ghost"
                                                        style={{ border: '1px solid rgb(130, 95, 196)', color: 'rgb(130, 95, 196)' }}

                                                    >
                                                        <FontAwesomeIcon icon={faBolt} style={{ marginRight: '8px' }} />
                                                        <span>Exchange Rate</span>
                                                    </Button>

                                                </div>
                                            </div>
                                            {paymentMethodSelected === '3623962430163299'
                                                && (<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <MyInput
                                                        column
                                                        width={180}
                                                        fieldName={'CardNumber'}
                                                        record={{}}
                                                        setRecord={""}
                                                    />
                                                    <MyInput
                                                        column
                                                        width={180}
                                                        fieldName={'HolderName'}
                                                        record={{}}
                                                        setRecord={""}
                                                    />

                                                    <MyInput
                                                        column
                                                        fieldType="date"
                                                        fieldName="ValidUntil"
                                                        record={{}}
                                                        setRecord={""}
                                                    />
                                                </div>)
                                            }
                                            {paymentMethodSelected === '3623993823412902'
                                                &&
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <MyInput
                                                        column
                                                        width={180}
                                                        fieldName={'ChequeNumber'}
                                                        record={{}}
                                                        setRecord={""}
                                                    />
                                                    <MyInput
                                                        column
                                                        width={180}
                                                        fieldName={'BankName'}
                                                        record={{}}
                                                        setRecord={""}
                                                    />

                                                    <MyInput
                                                        column
                                                        fieldType="date"
                                                        fieldName="ChequeDueDate"
                                                        record={{}}
                                                        setRecord={""}
                                                    /></div>
                                            }
                                            {paymentMethodSelected === '91849731565300'
                                                &&
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <MyInput
                                                        column
                                                        width={180}
                                                        fieldName={'transferNumber'}
                                                        record={{}}
                                                        setRecord={""}
                                                    />
                                                    <MyInput
                                                        column
                                                        width={180}
                                                        fieldName={'BankName'}
                                                        record={{}}
                                                        setRecord={""}
                                                    />

                                                    <MyInput
                                                        column
                                                        fieldType="date"
                                                        fieldName="transferDate"
                                                        record={{}}
                                                        setRecord={""}
                                                    /></div>
                                            }
                                            <div style={{ width: "100%", display: "flex", gap: "10px" }}>
                                                <div style={{ border: '1px solid #b6b7b8', flex: "2", borderRadius: "5px" }}>
                                                    <Table
                                                        style={{ maxHeight: 200, overflowY: "auto" }}
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
                                                <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
                                                    <MyInput
                                                        column
                                                        disabled={true}
                                                        width={180}
                                                        fieldName={'DueAmount'}
                                                        record={{}}
                                                        setRecord={""}
                                                    />
                                                    <MyInput
                                                        column
                                                        disabled={true}
                                                        width={180}
                                                        fieldName={'Patient`s free Balance'}
                                                        record={{}}
                                                        setRecord={""}
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
                            <br />
                            <Panel
                                bordered
                                header={
                                    <h6 className="title">
                                        <Translate>Main Visit Details</Translate>
                                    </h6>
                                }
                            >
                                <Stack>
                                    <Stack.Item grow={4}>
                                        <Form layout="inline" fluid>
                                            <MyInput
                                                vr={validationResult}
                                                width={165}
                                                column
                                                disabled={true}
                                                fieldLabel="Visit ID"
                                                fieldName="visitId"
                                                record={localEncounter}
                                                setRecord={setLocalEncounter}
                                            />

                                            <MyInput
                                                vr={validationResult}
                                                width={165}
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
                                                width={165}
                                                fieldType="select"
                                                fieldLabel="Encounter Type"
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
                                                width={165}
                                                fieldType="select"
                                                fieldLabel="Visit Type"
                                                fieldName="encounterTypeLkey"
                                                selectData={visitTypeLovQueryResponse?.object ?? []}
                                                selectDataLabel="lovDisplayVale"
                                                selectDataValue="key"
                                                record={localEncounter}
                                                setRecord={setLocalEncounter}
                                            />
                                            <MyInput
                                                vr={validationResult}
                                                column
                                                width={165}
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
                                                width={165}
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
                                                width={165}
                                                fieldType="select"
                                                fieldLabel="Priority"
                                                fieldName="encounterPriorityLkey"
                                                selectData={encounterPriorityLovQueryResponse?.object ?? []}
                                                selectDataLabel="lovDisplayVale"
                                                selectDataValue="key"
                                                record={localEncounter}
                                                setRecord={setLocalEncounter}
                                            />
                                            <MyInput
                                                vr={validationResult}
                                                column
                                                width={165}
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
                                                width={165}
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
                                                width={165}
                                                fieldLabel="Source Name"
                                                fieldName="sourceName"
                                                record={localEncounter}
                                                setRecord={setLocalEncounter}
                                            />
   <MyInput
                                                width={250}
                                                column
                                                
                                                disabled={false}
                                                fieldType='textarea'
                                                fieldLabel="Note"
                                                fieldName='encounterNotes'
                                                setRecord={setLocalEncounter}

                                                record={localEncounter}

                                            />
                                        </Form>
                                    </Stack.Item>
                                </Stack>
                            </Panel>


                            <br />
                            <Panel
                                collapsible

                                bordered
                                header={
                                    <h6 className="title">
                                        <Translate>Payment Detail</Translate>
                                    </h6>
                                }
                            >
                                <Stack>
                                    <Stack.Item grow={4}>
                                        <Form layout="inline" fluid>
                                            <MyInput
                                                vr={validationResult}
                                                column
                                                disabled={true}
                                                width={165}
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
                                                width={165}
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
                                                width={165}
                                                fieldType="select"
                                                fieldName="paymentTypeLkey"
                                                selectData={paymentTypeLovQueryResponse?.object ?? []}
                                                selectDataLabel="lovDisplayVale"
                                                selectDataValue="key"
                                                record={localEncounter}
                                                setRecord={setLocalEncounter}
                                            />
                                          

                                            <Button
                                                onClick={() => handleOpenPaymentModel()}
                                                appearance="ghost"
                                                style={{ border: '1px solid #00b1cc', backgroundColor: 'white', color: '#00b1cc', marginLeft: "3px", marginTop: '25px', zoom: 0.9 }}

                                            >
                                                <AddOutlineIcon style={{ marginRight: '5px', color: '#00b1cc' }} />
                                                <span>Add payment</span>
                                            </Button>
                                            <br/>
                                            {localEncounter?.paymentTypeLkey === '330434908679093' ?
                                                <Form layout="inline" fluid >
                                                <div style={{zoom:.8, display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px' }}>
                                              
 <MyLabel label="Insurance Plan Type" />
                <SelectPicker
               style={{width:'170px'}}
                                                   data={data}
               
                                                   value={
                                                        patientInsurance.key
                                                   }
                                                   onChange={(value) => {
                                                       const selectedItem = data.find((item) => item.value === value);
                                                       setPatientInsurance({ ...selectedItem.patientInsurance });
                                                       setLocalEncounter({...localEncounter,})
                                                   }}
                                    
                                                   
                                                   labelKey="label"
                                                   valueKey="value"
                                                  
               
                                               />

</div>
                                                    <MyInput
                                                        vr={validationResult}
                                                        column
                                                        width={165}
                                                        disabled={true}
                                                        fieldName="insurancePolicyNumber"
                                                        record={patientInsurance}
                                                        setRecord={setPatientInsurance}
                                                    />

                                                    <MyInput
                                                        vr={validationResult}
                                                        column
                                                        width={165}
                                                        disabled={true}
                                                        fieldName="groupNumber"
                                                        record={patientInsurance}
                                                        setRecord={setPatientInsurance}
                                                    />

                                                    <MyInput
                                                        vr={validationResult}
                                                        column
                                                        width={165}
                                                        disabled={true}
                                                        fieldType="select"
                                                        fieldName="insurancePlanTypeLkey"
                                                        selectData={InsurancePlanTypeLovQueryResponse?.object ?? []}
                                                        selectDataLabel="lovDisplayVale"
                                                        selectDataValue="key"
                                                        record={patientInsurance}
                                                        setRecord={setPatientInsurance}
                                                    />

                                                    <MyInput
                                                        vr={validationResult}
                                                        column
                                                        width={165}
                                                        disabled={true}
                                                        fieldName="authorizationNumbers"
                                                        record={patientInsurance}
                                                        setRecord={setPatientInsurance}
                                                    />
                                                    <MyInput
                                                        vr={validationResult}
                                                        column
                                                        width={165}
                                                        fieldType="date"
                                                        disabled={true}
                                                        fieldName="expirationDate"
                                                        record={patientInsurance}
                                                        setRecord={setPatientInsurance}
                                                    />
                                                </Form> : <></>
                                            }
                                        </Form>
                                    </Stack.Item>
                                </Stack>
                            </Panel>
                            <br />

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

                                                <Cell  >
                                                    {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ""}
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
                    </Modal.Body>
                    <Modal.Footer>

                    </Modal.Footer>
                </Modal>
            </Panel>
        </>
    );
};

export default PatientQuickAppointment;
