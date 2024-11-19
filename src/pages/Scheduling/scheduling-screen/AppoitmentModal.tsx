import MyInput from "@/components/MyInput";
import Translate from "@/components/Translate";
import QuickPatient from "@/pages/patient/patient-profile/quickPatient";
import { ApAppointment, ApPatient } from "@/types/model-types";
import { newApAppointment, newApPatient } from "@/types/model-types-constructor";
import { faBolt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { Button, ButtonToolbar, DatePicker, Divider, Drawer, Form, IconButton, Input, InputGroup, Modal, Pagination, Panel, SelectPicker, Stack, Table } from "rsuite";
import InfoRoundIcon from '@rsuite/icons/InfoRound';
import FileUploadIcon from '@rsuite/icons/FileUpload';
import DocPassIcon from '@rsuite/icons/DocPass';
import BlockIcon from '@rsuite/icons/Block';
import CheckIcon from '@rsuite/icons/Check';
import SearchIcon from '@rsuite/icons/Search';
import { initialListRequest, ListRequest } from "@/types/types";
import { addFilterToListRequest, fromCamelCaseToDBName } from "@/utils";
import { useGetPatientsQuery } from "@/services/patientService";
import { useGetFacilitiesQuery, useGetLovValuesByCodeQuery } from "@/services/setupService";
import TrashIcon from '@rsuite/icons/Trash';
import { useAppSelector } from "@/hooks";
import { useSaveAppointmentMutation } from "@/services/appointmentService";




const AppointmentModal = ({ isOpen, onClose, startAppoitmentStart }) => {


    const [quickPatientModalOpen, setQuickPatientModalOpen] = useState(false);
    const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
    const [appointment, setAppoitment] = useState<ApAppointment>({ ...newApAppointment })
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null); // To store selected event details
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedStartDate, setSelectedStartDate] = useState()
    const [validationResult, setValidationResult] = useState({});
    const [selectedCriterion, setSelectedCriterion] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [patientSearchTarget, setPatientSearchTarget] = useState('primary'); // primary, relation, etc..
    const [searchResultVisible, setSearchResultVisible] = useState(false);
    const [patientAge, setPatientAge] = useState({ patientAge: null })
    const [reRenderModal, setReRenderModal] = useState(true)

    const { Column, HeaderCell, Cell } = Table;
    const patientSlice = useAppSelector(state => state.patient);

    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: !searchKeyword || searchKeyword.length < 3
    });

    const {
        data: facilityListResponse,
        isLoading: isGettingFacilities,
        isFetching: isFetchingFacilities
    } = useGetFacilitiesQuery({ ...initialListRequest });

    const [saveAppointment, saveAppointmentMutation] = useSaveAppointmentMutation()

    useEffect(() => {
        console.log(patientSlice)
        console.log(patientSlice.patient)

        if (patientSlice?.patient) {
            setLocalPatient(patientSlice?.patient);
        }
    }, [patientSlice]);

    useEffect(() => {
        if (startAppoitmentStart) {
            setSelectedStartDate(startAppoitmentStart);
        }
    }, [startAppoitmentStart]);



    const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
    const { data: resourceTypeQueryResponse } = useGetLovValuesByCodeQuery('BOOK_RESOURCE_TYPE');
    const { data: instractionsTypeQueryResponse } = useGetLovValuesByCodeQuery('APP_INSTRUCTIONS')
    const { data: priorityQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY')
    const { data: procedureLevelQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_LEVEL')
    const { data: reminderTypeLovQueryResponse } = useGetLovValuesByCodeQuery('REMINDER_TYP');

    // const { data: cityLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    //     code: 'CITY',
    //     parentValueKey: localPatient.countryLkey
    //   });
    const { data: visitTypeQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');


    const {
        data: patientListResponse,
        isLoading: isGettingPatients,
        isFetching: isFetchingPatients,
        refetch: refetchPatients
    } = useGetPatientsQuery({ ...listRequest, filterLogic: 'or' });

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


    const handleSelectPatient = data => {
        if (patientSearchTarget === 'primary') {
            setLocalPatient(data);
        } else if (patientSearchTarget === 'relation') {
        }
        // refetchPatients({ ...listRequest, clearResults: true });
        setSearchResultVisible(false);
    };

    const closeModal = () => {
        onClose()
        handleClear()
    };

    const handleClear = () => {
        setLocalPatient(newApPatient)
        setAppoitment(newApAppointment)
        setPatientAge(null)
        setValidationResult(undefined);
        setReRenderModal(!reRenderModal)
        setSelectedStartDate(null)
    }
    useEffect(() => {
        calculateAge(localPatient?.dob)
        console.log(localPatient)
    }, [localPatient])

    const searchCriteriaOptions = [
        { label: 'MRN', value: 'patientMrn' },
        { label: 'Document Number', value: 'documentNo' },
        { label: 'Full Name', value: 'fullName' },
        { label: 'Archiving Number', value: 'archivingNumber' },
        { label: 'Primary Phone Number', value: 'mobileNumber' },
        { label: 'Date of Birth', value: 'dob' },
    ];

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

    const calculateAge = (dateOfBirth: Date | string): number | undefined => {
        if (dateOfBirth) {
            const dob = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);

            if (isNaN(dob.getTime())) {
                console.error("Invalid date of birth");
                return undefined;
            }

            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const monthDifference = today.getMonth() - dob.getMonth();

            if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
                age--;
            }

            // Update state or return age as needed
            setPatientAge({ patientAge: age });
            return age;
        }


    };



    useEffect(() => {
        console.log(resourceTypeQueryResponse)
    }, [resourceTypeQueryResponse])

    useEffect(() => {
        setAppoitment({ ...appointment, patientKey: localPatient.key })
    }, [localPatient])


    const handleSaveAppointment = () => {
        saveAppointment({...appointment,appointmentStart:selectedStartDate}).unwrap().then(()=>{
            closeModal()
            handleClear()
        })
    }

    return (

        <div>


            <Modal key={reRenderModal} size={1600} open={
                isOpen
            } onClose={onClose}>
                <Modal.Header>
                    <Modal.Title>Add Appointment</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Panel bordered>
                        <ButtonToolbar>
                            {conjurePatientSearchBar('primary')}
                            <Divider vertical />


                            <div>
                                <Button
                                    appearance="ghost"
                                    style={{ border: '1px solid rgb(130, 95, 196)', color: 'rgb(130, 95, 196)' }}
                                    // disabled={editing || localPatient.key !== undefined}
                                    onClick={() => setQuickPatientModalOpen(true)}
                                >
                                    <FontAwesomeIcon icon={faBolt} style={{ marginRight: '8px' }} />
                                    <span>Quick Patient</span>
                                </Button>

                                <QuickPatient
                                    open={quickPatientModalOpen}
                                    onClose={() => setQuickPatientModalOpen(false)}
                                />
                            </div>



                        </ButtonToolbar>
                    </Panel>

                    <br />
                    <Panel   //  ===================== > Patient Information < ===================== 
                        bordered
                        header={
                            <h5 className="title">
                                <Translate>Patient Information</Translate>
                            </h5>
                        }
                    >
                        <Stack>
                            <Stack.Item grow={1}>

                                <Form layout="inline" fluid>
                                    <MyInput

                                        width={110}
                                        vr={validationResult}
                                        column
                                        fieldLabel="MRN"
                                        fieldName="patientMrn"
                                        record={localPatient}
                                        setRecord={setLocalPatient}
                                        disabled
                                    />

                                    <MyInput
                                        width={250}
                                        vr={validationResult}
                                        column
                                        fieldName="fullName"
                                        record={localPatient}
                                        setRecord={setLocalPatient}
                                        disabled
                                    />

                                    <MyInput
                                        required
                                        width={120}
                                        vr={validationResult}
                                        column
                                        fieldName="documentNo"
                                        record={localPatient}
                                        setRecord={setLocalPatient}
                                        disabled
                                    />

                                    <MyInput
                                        width={150}

                                        required
                                        vr={validationResult}
                                        column
                                        fieldLabel="Document Type"
                                        fieldType="select"
                                        fieldName="documentTypeLkey"
                                        selectData={docTypeLovQueryResponse?.object ?? []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        record={localPatient}
                                        setRecord={setLocalPatient}
                                        disabled
                                    />


                                    <MyInput
                                        width={120}
                                        vr={validationResult}
                                        column
                                        fieldName="patientAge"
                                        record={patientAge}
                                        setRecord={setPatientAge}
                                        disabled
                                    />
                                    <MyInput
                                        width={160}
                                        //   vr={validationResult}
                                        column
                                        fieldType="date"
                                        fieldLabel="DOB"
                                        fieldName="dob"
                                        record={localPatient}
                                        setRecord={setLocalPatient}
                                        disabled
                                    />

                                    <MyInput
                                        required
                                        width={80}
                                        vr={validationResult}
                                        column
                                        fieldLabel="Sex At birth"
                                        fieldType="select"
                                        fieldName="genderLkey"
                                        selectData={
                                            genderLovQueryResponse?.object ??
                                            []}
                                        selectDataLabel="lovDisplayVale"
                                        selectDataValue="key"
                                        record={localPatient}
                                        setRecord={setLocalPatient}
                                        disabled
                                    />

                                    <MyInput
                                        width={165}
                                        vr={validationResult}
                                        column
                                        fieldName="mobileNumber"
                                        record={localPatient}
                                        setRecord={setLocalPatient}
                                        disabled
                                    />

                                    <MyInput
                                        width={165}
                                        vr={validationResult}
                                        column
                                        fieldName="email"
                                        record={localPatient}
                                        setRecord={setLocalPatient}
                                        disabled
                                    />



                                </Form>
                            </Stack.Item>
                        </Stack>
                    </Panel>

                    <br />

                    {/* ===================== > Appoitment Details < =====================  */}

                    <Form
                        layout="inline" style={{ display: "flex", alignItems: "center" }} fluid>

                        <MyInput

                            width={300}
                            column
                            fieldLabel="Facility"
                            selectData={facilityListResponse?.object ?? []}
                            fieldType="select"
                            selectDataLabel="facilityName"
                            selectDataValue="key"
                            fieldName="facilityKey"


                            record={appointment}
                            setRecord={setAppoitment}
                        />

                        <MyInput
                            required
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Resource Type"
                            fieldType="select"
                            fieldName="resourceTypeLkey"
                            selectData={resourceTypeQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={appointment}
                            setRecord={setAppoitment}
                        />

                        <MyInput
                            required
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Resource"
                            fieldType="select"
                            fieldName="resourceLkey"
                            selectData={[]}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={appointment}
                            setRecord={setAppoitment}
                        />

                        <MyInput
                            required
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Visit Type"
                            fieldType="select"
                            fieldName="visitTypeLkey"
                            selectData={visitTypeQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={appointment}
                            setRecord={setAppoitment}
                        />
                        <div style={{ width: "100%", marginTop: "10px" }}>
                            <div>
                                <label htmlFor="appointment-date">Start Appointment Date</label>
                                <DatePicker
                                    id="appointment-date"
                                    value={selectedStartDate}
                                    format="MM/dd/yyyy HH:mm"
                                    onChange={(e) => setSelectedStartDate(e)}
                                />
                                <InfoRoundIcon style={{ marginLeft: "5px", fontSize: "22px", color: "blue" }} />

                            </div>


                        </div>

                        <div style={{ display: "flex", width: "100%", justifyContent: "flex-end", marginTop: "30px" }}>
                            <IconButton
                                color="cyan"
                                style={{ marginRight: "70px", width: "180px" }}
                                appearance="primary"
                                icon={<DocPassIcon />}
                            >
                                Add To Waiting List
                            </IconButton>
                        </div>
                    </Form>
                    <br />
                    <br />



                    <Form layout="inline" style={{ display: "flex" }} fluid>

                        <div style={{ display: "flex", flexDirection: 'column' }} >
                            <MyInput

                                required
                                width={450}
                                vr={validationResult}
                                column
                                fieldLabel="Instructions"
                                fieldType="select"
                                fieldName="instructionsLkey"
                                selectData={instractionsTypeQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={appointment}
                                setRecord={setAppoitment}
                            />
                            <Input as="textarea" style={{ width: 450, marginTop: 20 }} rows={3} placeholder="Textarea" />

                        </div>


                        <MyInput
                            vr={validationResult}
                            fieldType="textarea"
                            column
                            fieldName="Notes"
                            width={400}
                            height={126}
                            record={appointment}
                            setRecord={setAppoitment}
                        />

                        <MyInput
                            required
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Priority"
                            fieldType="select"
                            fieldName="priority"
                            selectData={priorityQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={appointment}
                            setRecord={setAppoitment}
                        />
                        <div style={{ display: "flex", flexDirection: 'column' }} >


                            <div>
                                <MyInput
                                    width={165}
                                    column
                                    fieldLabel="Reminder"
                                    fieldType="checkbox"
                                    fieldName="isReminder"
                                    record={appointment}
                                    setRecord={setAppoitment}
                                />
                                <MyInput
                                    width={165}
                                    column
                                    fieldLabel="consent Form"
                                    fieldType="checkbox"
                                    fieldName="consentForm"
                                    record={appointment}
                                    setRecord={setAppoitment}
                                />
                            </div>

                            <div style={{ marginTop: "35px" }}>
                                <MyInput
                                    required
                                    width={165}
                                    vr={validationResult}
                                    column
                                    fieldLabel="Reminder Type"
                                    fieldType="select"
                                    fieldName="reminderTypeLkey"
                                    selectData={reminderTypeLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    record={appointment}
                                    setRecord={setAppoitment}
                                />
                            </div>


                        </div>


                        <div style={{ display: "flex", width: "20%", justifyContent: "flex-end", marginTop: "30px" }}>

                            <IconButton style={{ marginRight: "70px", width: "180px", height: "30px" }} color="cyan"

                                appearance="primary" icon={<FileUploadIcon />}
                            >
                                Attach File
                            </IconButton>
                        </div>



                    </Form>


                    <Form layout="inline" style={{ display: "flex", alignItems: "center" }} fluid>
                        <MyInput
                            required
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="Refering Physician"
                            fieldType="select"
                            fieldName="referingPhysician"
                            selectData={[]}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={appointment}
                            setRecord={setAppoitment}
                        />

                        <MyInput
                            width={165}
                            vr={validationResult}
                            column
                            fieldName="externalPhysician"
                            record={appointment}
                            setRecord={setAppoitment}
                        />
                        <MyInput
                            required
                            width={165}
                            vr={validationResult}
                            column
                            fieldLabel="pricedure Level"
                            fieldType="select"
                            fieldName="pricedureLevel"
                            selectData={procedureLevelQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={appointment}
                            setRecord={setAppoitment}
                        />
                    </Form>


                    {/* {selectedEvent ? (
                    <>
                        <p><strong>Start:</strong> {moment(selectedEvent.start).format("LLL")}</p>
                        <p><strong>End:</strong> {moment(selectedEvent.end).format("LLL")}</p>
                        <p><strong>Description:</strong> {selectedEvent.text}</p>
                    </>
                ) : (
                    selectedSlot && (
                        <>
                            <p><strong>Start:</strong> {moment(selectedSlot.start).format("LLL")}</p>
                            <p><strong>End:</strong> {moment(selectedSlot.end).format("LLL")}</p>
                        </>
                    )
                )} */}
                </Modal.Body>
                <Modal.Footer>
                    <IconButton onClick={() => { console.log(selectedEvent || selectedSlot), console.log(appointment),handleSaveAppointment() }} color="violet" appearance="primary" icon={<CheckIcon />}>
                        Save
                    </IconButton>
                    <Divider vertical />
                    <IconButton color="orange" onClick={handleClear} appearance="primary" icon={<TrashIcon />}>
                        Clear
                    </IconButton>
                    <IconButton color="blue" onClick={closeModal} appearance="primary" icon={<BlockIcon />}>
                        Cancel
                    </IconButton>
                </Modal.Footer>
            </Modal>

            <Drawer
                size="lg"
                placement={'left'}
                open={searchResultVisible}
                onClose={() => { setSearchResultVisible(false) }}
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

        </div>

    );

}

export default AppointmentModal;