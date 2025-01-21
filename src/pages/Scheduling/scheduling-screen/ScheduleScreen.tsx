import React, { useEffect, useState } from "react";
import { Calendar as BigCalendar, Views, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar as RsuiteCalendar, TagPicker, ButtonToolbar, Panel, InputGroup, SelectPicker, Input, IconButton, Button, Form, Drawer, Calendar, TagGroup, Tag, Divider, DatePicker, Checkbox, Modal, } from "rsuite";
import "./styles.less";
import SearchIcon from '@rsuite/icons/Search';
import {
    newApAppointment,

} from '@/types/model-types-constructor';

import DetailIcon from '@rsuite/icons/Detail';
import SendIcon from '@rsuite/icons/Send';
import CharacterAuthorizeIcon from '@rsuite/icons/CharacterAuthorize';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


import {
    useGetFacilitiesQuery,
    useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { initialListRequest, ListRequest } from "@/types/types";
import AppointmentModal from "./AppoitmentModal";
import { ApPatient, ApAppointment } from "@/types/model-types";
import { faPrint } from "@fortawesome/free-solid-svg-icons";
import { notify } from "@/utils/uiReducerActions";
import { useAppDispatch } from "@/hooks";
import AppointmentActionsModal from "./AppointmentActionsModal";
import { useGetResourcesAvailabilityQuery, useGetResourcesQuery, useGetAppointmentsQuery } from '@/services/appointmentService'
import MyInput from '@/components/MyInput';
import Resources from "@/pages/appointment/resources";
 
const ScheduleScreen = () => {
    const localizer = momentLocalizer(moment);
    const [validationResult, setValidationResult] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [ActionsModalOpen, setActionsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedStartDate, setSelectedStartDate] = useState()
    const [resuorceAvailabilityPeriods, setResuorceAvailabilityPeriods] = useState()
    //Calendar Filters 
    const [selectedFacility, setSelectedFacility] = useState(null)
    const [selectedResourceType, setSelectedResourceType] = useState(null)
    const [selectedResources, setSelectedResources] = useState([])
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
    const [appointmentsData, setAppointmentsData] = useState([])
    const [selectedAppointment, setSelectedAppointment] = useState()
    const [showAppointmentOnly, setShowAppointmentOnly] = useState(false)
    const [filteredResourcesList, setFilteredResourcesList] = useState([])
    const [showCanceled, setShowCanceled] = useState<boolean>(false)
    const [filteredMonth, setFilteredMonth] = useState<Date>()
    const [showReasonModal, setShowReasonModal] = useState(false);

    const {
        data: appointments,
        refetch: refitchAppointments,
        error,
        isLoading
    } = useGetAppointmentsQuery({
        resource_type: selectedResourceType?.resourcesType || null,
        facility_id: selectedFacility?.facilityKey || null,
        resources: selectedResources ? selectedResources.resourceKey : [],

    });



    const extractTimeFromTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const dateTime = `${hours}:${minutes} `
        return dateTime;
    };



    useEffect(() => {
        if (appointments?.object && resourcesListResponse?.object) {
            const today = new Date();

            const formattedAppointments = appointments.object.map((appointment) => {
                const dob = new Date(appointment?.patient?.dob);

                const resource = resourcesListResponse.object.find(
                    (item) => item.key === appointment.resourceKey
                );

                const isHidden = appointment?.appointmentStatus === "Canceled";
                return {
                    title: ` ${appointment?.patient?.fullName}, ${isNaN(dob) ? "Unknown" : today.getFullYear() - dob.getFullYear()
                        }Y , ${resource?.resourceName || "Unknown Resource"} `, // Customize title as needed
                    start: convertDate(appointment.appointmentStart),
                    end: convertDate(appointment.appointmentEnd),
                    text: appointment.notes || "No additional details available",
                    appointmentData: appointment,
                    hidden: isHidden,
                    fromTo: `${extractTimeFromTimestamp(appointment.appointmentStart)} - ${extractTimeFromTimestamp(appointment.appointmentEnd)}`
                };
            });
            setAppointmentsData(formattedAppointments);
        }
    }, [appointments, resourcesListResponse]);





    const { data: resourceTypeQueryResponse } = useGetLovValuesByCodeQuery('BOOK_RESOURCE_TYPE');


    const { data: resourcesListResponse } = useGetResourcesQuery(listRequest);

    useEffect(() => {
        if (selectedResourceType) {
            const filtered = resourcesListResponse.object.filter(resource => resource.resourceTypeLkey === selectedResourceType?.resourcesType);
            setFilteredResourcesList(filtered);
        }
    }, [resourcesListResponse, selectedResourceType?.resourcesType]);




    useEffect(() => {
        if (selectedSlot) {
            setSelectedStartDate(selectedSlot?.slots[0])
        }
    }, [selectedSlot])
    const handleSelectEvent = (event) => {
        console.log(event);
        console.log(event?.appointmentData?.appointmentStatus);
        setSelectedEvent(event); 
        if (event?.appointmentData?.appointmentStatus === "Canceled" || event?.appointmentData?.appointmentStatus === "No-Show") {
            setShowReasonModal(true);
            return;
        }

        setActionsModalOpen(true); 
    };


    const closeModal = () => {
        setModalOpen(false);

    };

    const { data: facilityListResponse, refetch: refetchFacility } = useGetFacilitiesQuery({
        ...initialListRequest
    });

    const eventPropGetter = (event) => {
        const status = event?.appointmentData.appointmentStatus;
        switch (status) {
            case "Confirmed":
                return {
                    style: { backgroundColor: "#dab1da", color: "black" }, // Light Purple
                }
            case "Checked-In":
                return {
                    style: { backgroundColor: "#AAFFFC", color: "black" }, // Light Cyan
                }
            case "Completed":
                return {
                    style: { backgroundColor: "#90d5ff", color: "black" }, // Light Blue
                }
            case "Canceled":
                return {
                    style: { backgroundColor: "#cbcbcb", color: "black" }, // Cool Grey 
                }
            case "No-Show":
                return {
                    style: { backgroundColor: "#fffd8d", color: "black" }, // Cool Grey 
                }
            // default:
            //     return <p>Unknown status</p>;
        }

        if (event?.appointmentData.appointmentStatus === "Confirmed") { // Example: Identify "activities" by a property
            return {
                style: { backgroundColor: "#AAFFFC", color: "black" }, // Blue background, white text
            };
        }
        return {}; // Default style for other events
    };


    const convertDate = (appointmentEnd) => {
        const endDate = new Date(appointmentEnd);
        // Format to `new Date(year, month, day, hours, minutes)`
        const formattedEnd = new Date(
            endDate.getUTCFullYear(), // Year
            endDate.getUTCMonth(),   // Month (0-based index)
            endDate.getUTCDate(),    // Day
            endDate.getUTCHours(),   // Hours
            endDate.getUTCMinutes()  // Minutes
        );
        return (formattedEnd);
    }

    const [open, setOpen] = React.useState(false);
    const [size, setSize] = React.useState();
    const handleOpen = value => {
        setSize(value);
        setOpen(true);
    };
    const handleClose = () => setOpen(false);
    const [selectedCriterion, setSelectedCriterion] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [appointment, setAppointment] = useState<ApAppointment>({ ...newApAppointment });
    const [drowerOpen, setDrowerOpen] = useState(false)
    const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const dispatch = useAppDispatch();

    const searchCriteriaOptions = [
        { label: 'MRN', value: 'patientMrn' },
        { label: 'Document Number', value: 'documentNo' },
        { label: 'Full Name', value: 'fullName' },
        { label: 'Archiving Number', value: 'archivingNumber' },
        { label: 'Primary Phone Number', value: 'mobileNumber' },
        { label: 'Date of Birth', value: 'dob' },
    ];
    const conjurePatientSearchBar = target => {
        return (
            <Panel>

                <ButtonToolbar>
                    <SelectPicker label="Search Criteria" data={searchCriteriaOptions} onChange={(e) => { setSelectedCriterion(e) }} style={{ width: 250 }} />

                    <InputGroup inside style={{ width: '350px', direction: 'ltr' }}>
                        <Input
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    //   search(target);
                                    console.log(target)
                                }
                            }}
                            placeholder={'Search Patients '}
                            value={searchKeyword}
                            onChange={e => setSearchKeyword(e)}
                        />
                        <InputGroup.Button
                        //  onClick={() => search(target)} 
                        >
                            <SearchIcon />
                        </InputGroup.Button>
                    </InputGroup>
                </ButtonToolbar>
            </Panel>

        );
    };

    const [currentView, setCurrentView] = React.useState("month");
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const handleDateSelection = (date) => {
        if (currentView === "month") {
            setCurrentView("day"); // Switch to day view
            setCurrentDate(date);  // Update the selected date
        }
    };

    const visibleAppointments = currentView === "agenda" || showCanceled
        ? appointmentsData // Show all events in the agenda view
        : appointmentsData.filter((event) => !event.hidden);


    const handleChangeAppointment = () => {
        setAppointment(selectedEvent.appointmentData)
        setModalOpen(true)
        setActionsModalOpen(false)
    }

    const handleViewAppointment = () => {
        setAppointment(selectedEvent.appointmentData)
        setModalOpen(true)
        setActionsModalOpen(false)
        setShowAppointmentOnly(true)
    }
    useEffect(() => {
        console.log(filteredMonth)
        console.log(drowerOpen)
        setDrowerOpen(false)

    }, [filteredMonth])

    const handleDateChange = (date) => {
        if (date) {
            // Set to the first day of the selected month
            const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            setFilteredMonth(firstDayOfMonth);
            console.log(firstDayOfMonth);
        }
    };

    const CustomToolbar = ({ label, onNavigate, onView }) => {
        return (
            <div className="rbc-toolbar">
                <span className="rbc-btn-group">
                    <button onClick={() => onNavigate("PREV")}>Back</button>
                    <button onClick={() => onNavigate("TODAY")}>Today</button>
                    <button onClick={() => onNavigate("NEXT")}>Next</button>
                </span>
                <span
                    className="rbc-toolbar-label"
                    onClick={() => setDrowerOpen(true)}
                    style={{ cursor: "pointer", fontWeight: "bold" }}
                >


                    {drowerOpen ? <DatePicker value={filteredMonth} defaultOpen appearance="subtle" onChange={handleDateChange} format="yyyy-MM" /> : label}

                </span>
                <span className="rbc-btn-group">
                    <button onClick={() => onView(Views.MONTH)}>Month</button>
                    <button onClick={() => onView(Views.WEEK)}>Week</button>
                    <button onClick={() => onView(Views.DAY)}>Day</button>
                    <button onClick={() => onView(Views.AGENDA)}>Agenda</button>
                </span>
            </div>
        );
    };
    const getTooltipContent = (event) => {
        // Define tooltip content based on the current view
        if (currentView === "month") {
            return `${event.title} - ${event.fromTo}`;
        } else {
            return `${event.title}`;
        }
    };

    const [value, setValue] = useState(new Date());
    const [currentCalView, setCurrentCalView] = useState("month"); // Force "month" view

    useEffect(() => {
        console.log(selectedEvent?.appointmentData.otherReason)
    }, [selectedEvent])

    return (
        <div>
            <div className="inline-two-four-container">
                <div className="left-section"  >
                    {/* <RsuiteCalendar compact style={{ width: 320, height: 320 }} /> */}
                    <ButtonToolbar>
                        <IconButton onClick={() => { setModalOpen(true) }} appearance="primary" color="violet" style={{ width: "45%" }} icon={<DetailIcon />}>Add Appointments</IconButton>
                        <IconButton appearance="ghost" color="violet" style={{ width: "50%" }} icon={<SendIcon />}> View App Requests</IconButton>
                        <IconButton appearance="primary" color="blue" style={{ width: "45%" }} icon={<CharacterAuthorizeIcon />}>Bulk Appointments</IconButton>
                        <IconButton color="blue" appearance="ghost" style={{ width: "50%" }} icon={<SearchIcon />}>Search For Appointments</IconButton>

                        <Button style={{
                            width: "45%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            borderRadius: "5px"
                        }}
                            color="cyan" appearance="primary" >

                            <FontAwesomeIcon icon={faPrint} style={{ marginRight: "25px", fontSize: "18px" }} />
                            Print Report
                        </Button>
                        <IconButton color="cyan" appearance="ghost" style={{ width: "50%" }} icon={<DetailIcon />}>Waiting List</IconButton>


                    </ButtonToolbar>


                    <br />
                    <br />

                    <Form fluid layout="inline"  >
                        <MyInput
                            disabled
                            width={300}
                            vr={validationResult}
                            column
                            fieldLabel="City"
                            fieldType="select"
                            fieldName="durationLkey"
                            selectData={[]}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                        // record={appointment}
                        // setRecord={setAppoitment}
                        />
                    </Form>

                    <Form fluid layout="inline"  >

                        <MyInput

                            width={300}
                            column
                            fieldLabel="Facility"
                            selectData={facilityListResponse?.object ?? []}
                            fieldType="select"
                            selectDataLabel="facilityName"
                            selectDataValue="key"
                            fieldName="facilityKey"
                            record={selectedFacility}
                            setRecord={setSelectedFacility}
                        />
                    </Form>
                    <Form fluid layout="inline"  >
                        <MyInput
                            width={300}
                            vr={validationResult}
                            column
                            fieldLabel="Resources Type"
                            fieldType="select"
                            fieldName="resourcesType"
                            selectData={resourceTypeQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={selectedResourceType}
                            setRecord={setSelectedResourceType}
                        />
                    </Form>

                    <Form fluid layout="inline"   >

                        <MyInput
                            width={300}
                            column
                            fieldLabel="Resources"
                            selectData={filteredResourcesList.length > 0 ? filteredResourcesList : !selectedResourceType?.resourcesType ? resourcesListResponse?.object : []}
                            fieldType="multyPicker"
                            selectDataLabel="resourceName"
                            selectDataValue="key"
                            fieldName="resourceKey"
                            record={selectedResources}
                            setRecord={setSelectedResources}
                        />
                    </Form>
                    <div></div>
                    <Checkbox onChange={() => setShowCanceled(!showCanceled)}>Show Canceled</Checkbox>

                    <Divider style={{ marginTop: "50px" }}> </Divider>

                    <TagGroup style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: "50%" }}>

                        <Tag style={{ backgroundColor: "#3174ad" }}><span style={{ color: "white" }}>New Appointment</span></Tag>
                        <Tag style={{ backgroundColor: "#AAFFFC" }}>Checked In Appointment</Tag>
                        <Tag style={{ backgroundColor: "#dab1da" }} >Confirmed Appointment</Tag>
                        <Tag style={{ backgroundColor: "#fffd8d" }}>No Show Appointment</Tag>
                        <Tag style={{ backgroundColor: "#cbcbcb" }} >Cancled Appointment</Tag>
                        <Tag style={{ backgroundColor: "#90d5ff" }} >Completed Appointment</Tag>


                    </TagGroup>


                </div>
                <div className="right-section">
                    <BigCalendar
                        localizer={localizer}
                        events={visibleAppointments}
                        onSelectSlot={(slotInfo) => {
                            console.log("Selected slot:", slotInfo);
                            setModalOpen(true)
                        }}
                        startAccessor="start"
                        endAccessor="end"
                        views={["month", "week", "day", "agenda"]}
                        defaultView="month"
                        selectable={true}
                        onSelectEvent={(event) => {
                            handleSelectEvent(event);  // select event

                        }}
                        tooltipAccessor={(event) => getTooltipContent(event)} // Dynamic tooltip content
                        // style={{ height: "600px" }}

                        onView={(view) => setCurrentView(view)}
                        style={{ height: 600 }}
                        eventPropGetter={eventPropGetter}
                        components={{
                            toolbar: CustomToolbar,

                        }}

                        date={filteredMonth}
                    />
                </div>
            </div>


            <AppointmentModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false), setShowAppointmentOnly(false) }}
                appointmentData={selectedEvent?.appointmentData}
                resourceType={selectedResourceType}
                facility={selectedFacility}
                onSave={refitchAppointments}
                showOnly={showAppointmentOnly}
            />
            <AppointmentActionsModal viewAppointment={() => handleViewAppointment()} editAppointment={() => handleChangeAppointment()} onStatusChange={refitchAppointments} isActionsModalOpen={ActionsModalOpen}
                onActionsModalClose={() => { setSelectedEvent(null), setActionsModalOpen(false), setAppointment(null) }}
                appointment={selectedEvent} />

            <Drawer placement={'left'} open={false} onClose={() => setDrowerOpen(false)}>
                <Drawer.Header>
                    <Drawer.Title></Drawer.Title>
                    <Drawer.Actions>
                        <Button onClick={() => setDrowerOpen(false)}>Cancel</Button>
                        <Button onClick={() => setDrowerOpen(false)} appearance="primary">
                            Confirm
                        </Button>
                    </Drawer.Actions>
                </Drawer.Header>
                <Drawer.Body>
                    <DatePicker
                        format="yyyy-MM" // Only show year and month
                        placeholder="Select Month and Year"
                        // onChange={handleSelect} // Trigger filter on change
                        // value={selectedDate}
                        cleanable
                        placement="autoVerticalStart" // Position of the dropdown
                        style={{ width: 500 }}
                    />

                </Drawer.Body>
            </Drawer>

            <Modal  open={showReasonModal} onClose={() => setShowReasonModal(false)}>
                <Modal.Header>
                </Modal.Header>

                <Modal.Body>
                    <br />
                    <br />

                    <Form layout="inline">
                        <div>
                            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                Reason
                            </label>
                            <Input value={selectedEvent?.appointmentData?.reasonLvalue?.lovDisplayVale??null} width={350}  />

                        </div>
                        <br />
                        <div>
                            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                Other Reason
                            </label>
                            <Input value={selectedEvent?.appointmentData.otherReason}  width={350}   />

                        </div>
                    </Form>

                    <br />
                    <br />
                </Modal.Body>

            </Modal>

        </div>
    );
};



export default ScheduleScreen;
