import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { ApPatientInsurance } from '@/types/model-types';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import ReloadIcon from '@rsuite/icons/Reload';
const { Column, HeaderCell, Cell } = Table;
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import { Check } from '@rsuite/icons';
import { Modal, Checkbox } from 'rsuite';
import React, { useEffect, useState } from 'react';
import {
    ButtonToolbar,
    Form,
    IconButton,
    Panel,
    Stack,
    Table,
    SelectPicker,
    Button
} from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import {
    useGetPatientInsuranceQuery,
} from '@/services/patientService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    useGetDepartmentsQuery,
    useGetLovValuesByCodeQuery,
    useGetPractitionersQuery,

} from '@/services/setupService';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import {
    useCompleteEncounterRegistrationMutation
} from '@/services/encounterService';
import { notify } from '@/utils/uiReducerActions';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import {
    newApPatientInsurance,
} from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import MyLabel from '@/components/MyLabel';
const PatientQuickAppointment = ({ quickAppointmentModel, localPatient, setQuickAppointmentModel }) => {
    const [patientInsurance, setPatientInsurance] = useState<ApPatientInsurance>({ ...newApPatientInsurance });
    const dispatch = useAppDispatch();
    const [openModelPayment, setOpenModelPayment] = React.useState(false);
    const [localEncounter, setLocalEncounter] = useState({ ...newApEncounter, patientKey: localPatient.key, plannedStartDate: new Date() });
    const [validationResult, setValidationResult] = useState({});
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const [saveEncounter, saveEncounterMutation] = useCompleteEncounterRegistrationMutation();
    const { data: patientInsuranceResponse } = useGetPatientInsuranceQuery(
        {
            patientKey: localPatient?.key
        },
        { skip: !localPatient.key }
    );
    const data = (patientInsuranceResponse ?? []).map(item => ({
        label: item.insuranceProvider,
        value: item.key,
        patientInsurance: item
    }));

    /* load page LOV */
    const { data: encounterPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
    const { data: encounterReasonLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_REASON');
    const { data: visitTypeLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');
    const { data: encounterTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_TYPE');
    const { data: paymentTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PAY_TYPS');
    const { data: paymentMethodLovQueryResponse } = useGetLovValuesByCodeQuery('PAY_METHOD');
    const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
    const { data: InsurancePlanTypeLovQueryResponse } = useGetLovValuesByCodeQuery('INS_PLAN_TYPS');
    const { data: patOriginLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_ORIGIN');
    const { data: practitionerListResponse } = useGetPractitionersQuery({ ...initialListRequest });
    const { data: departmentListResponse } = useGetDepartmentsQuery({ ...initialListRequest });
    const [paymentMethodSelected, setPaymentMethodSelected] = useState(null);
    const handleOpenPaymentModel = () => setOpenModelPayment(true);
    const handleClosePaymentModel = () => setOpenModelPayment(false);
    const handleSavePayment = () => {
        setOpenModelPayment(false);
    };
    const handleSave = () => {
        if (localEncounter && localEncounter.patientKey) {
            saveEncounter({ ...localEncounter, patientKey: localPatient.key, plannedStartDate: new Date() }).unwrap();
        } else {
            dispatch(notify({ msg: 'encounter not linked to patient', sev: 'error' }));
        }
    };
    const handleClear = () => {
        setLocalEncounter({
            ...newApEncounter, patientKey: localPatient.key, plannedStartDate: new Date(),
            encounterStatusLkey: undefined,
            encounterClassLkey: null,
            encounterPriorityLkey: null,
            encounterTypeLkey: null,
            serviceTypeLkey: null,
            patientStatusLkey: null,
            basedOnLkey: null,
            visitTypeLkey: null,
            physicalExamSummeryKey: null,
            dischargeTypeLkey: null,
            paymentTypeLkey: null,
            payerTypeLkey: null,
            locationTypeLkey: null,
            physicianKey: null,
            departmentKey: null,
            reasonLkey: null,


        })
    };
    useEffect(() => {
        if (saveEncounterMutation && saveEncounterMutation.status === 'fulfilled') {
            setLocalEncounter(saveEncounterMutation.data);
            dispatch(notify('Encounter Saved Successfuly!'));
        } else if (saveEncounterMutation && saveEncounterMutation.status === 'rejected') {
            setValidationResult(saveEncounterMutation.error);
        }
    }, [saveEncounterMutation]);
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
                                <div style={{ display: 'flex', width: '100%' }}>

                                    <ButtonToolbar style={{ display: 'flex', marginLeft: 'auto' }}>       <Button
                                        onClick={handleSave}
                                        style={{ display: 'flex', border: '1px solid #00b1cc', backgroundColor: '#00b1cc', color: 'white', marginLeft: 'auto' }}
                                    >
                                        <FontAwesomeIcon icon={faCheckDouble} style={{ marginRight: '5px', color: 'white' }} />
                                        <span>Save</span></Button>
                                        <Button
                                            onClick={handleClear}
                                            style={{ display: 'flex', border: '1px solid #00b1cc', backgroundColor: 'white', color: '#00b1cc', marginLeft: 'auto' }}
                                        >
                                            <FontAwesomeIcon icon={faBroom} style={{ marginRight: '5px', color: ' #00b1cc' }} />
                                            <span>Clear</span>
                                        </Button></ButtonToolbar>
                                </div>

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
                                                menuStyle={{ marginTop: '100px', marginLeft: '160px' }}

                                            />
                                            <MyInput
                                                vr={validationResult}
                                                column
                                                width={165}
                                                fieldType="select"
                                                fieldLabel="Visit Type"
                                                fieldName="visitTypeLkey"
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
                                            <br />
                                            {localEncounter?.paymentTypeLkey === '330434908679093' ?
                                                <Form layout="inline" fluid style={{ display: 'flex', alignItems: 'center' }}>
                                                    <div style={{ zoom: .8, display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px' }}>

                                                        <MyLabel label="Insurance Plan Type" />
                                                        <SelectPicker
                                                            style={{ width: '170px' }}
                                                            data={data}
                                                            value={patientInsurance.key || null}
                                                            onChange={(value) => {
                                                                if (value === null) {
                                                                    setPatientInsurance({ ...newApPatientInsurance });
                                                                    setLocalEncounter({ ...localEncounter });
                                                                } else {
                                                                    const selectedItem = data.find((item) => item.value === value);
                                                                    setPatientInsurance(selectedItem.patientInsurance || {});
                                                                    setLocalEncounter({ ...localEncounter, insuranceKey: selectedItem.key });
                                                                }
                                                            }}
                                                            labelKey="label"
                                                            valueKey="value"
                                                            cleanable={true}
                                                            menuStyle={{ marginTop: '150px', marginLeft: '100px', width: 170, padding: 5, zoom: .8 }}
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
