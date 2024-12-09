import React, { useEffect, useState } from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar as RsuiteCalendar, TagPicker, ButtonToolbar, Panel, InputGroup, SelectPicker, Input, IconButton, Button, Form, } from "rsuite";
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

                const isHidden = appointment?.appointmentStatus === "No-Show";

                return {
                    title: ` ${appointment?.patient?.fullName}, ${isNaN(dob) ? "Unknown" : today.getFullYear() - dob.getFullYear()
                        }Y , ${resource?.resourceName || "Unknown Resource"},  ${extractTimeFromTimestamp(appointment.appointmentStart)} - ${extractTimeFromTimestamp(appointment.appointmentEnd)} `, // Customize title as needed
                    start: convertDate(appointment.appointmentStart),
                    end: convertDate(appointment.appointmentEnd),
                    text: appointment.notes || "No additional details available",
                    appointmentData: appointment,
                    hidden: isHidden,
                };
            });

            setAppointmentsData(formattedAppointments);
        }
    }, [appointments, resourcesListResponse]);




    const { data: resourcesListResponse } = useGetResourcesQuery(listRequest);

    const { data: resourceTypeQueryResponse } = useGetLovValuesByCodeQuery('BOOK_RESOURCE_TYPE');



    useEffect(() => {
        if (selectedSlot) {
            setSelectedStartDate(selectedSlot?.slots[0])
        }
    }, [selectedSlot])
    const handleSelectEvent = (event) => {
        console.log(event)
        setSelectedEvent(event); // Set selected event details
        setActionsModalOpen(true)

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

    const visibleAppointments = currentView === "agenda"
        ? appointmentsData // Show all events in the agenda view
        : appointmentsData.filter((event) => !event.hidden); // Example: Hide events with a "hidden" flag in other views

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
                            selectData={resourcesListResponse?.object ?? []}
                            fieldType="multyPicker"
                            selectDataLabel="resourceName"
                            selectDataValue="key"
                            fieldName="resourceKey"
                            record={selectedResources}
                            setRecord={setSelectedResources}
                        />
                    </Form>



                    <Button onClick={() => {
                        console.log(selectedResourceType);
                        console.log(selectedResources);
                        console.log(selectedFacility);
                        console.log({
                            resource_type: selectedResourceType?.resourcesType || null,
                            facility_id: selectedFacility?.facilityKey || null,
                            resources: selectedResources ? selectedResources.resourceKey : [],

                        })
                        console.log(appointments)


                    }}>Test</Button>


                </div>
                <div className="right-section">
                    <BigCalendar
                        localizer={localizer}
                        events={visibleAppointments} // Use the filtered appointments
                        startAccessor="start"
                        endAccessor="end"
                        views={["month", "week", "day", "agenda"]}
                        defaultView="month"
                        selectable={true}
                        onSelectEvent={(event) => {
                            handleSelectEvent(event); // Example event handler
                        }}
                        onView={(view) => setCurrentView(view)} // Track the current view
                        style={{ height: 600 }}
                        eventPropGetter={eventPropGetter} // Apply custom styles

                    />
                </div>
            </div>


            <AppointmentModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                startAppoitmentStart={selectedStartDate}
                resourceType={selectedResourceType}
                facility={selectedFacility}
                onSave={refitchAppointments}
            />
            <AppointmentActionsModal onStatusChange={refitchAppointments} isActionsModalOpen={ActionsModalOpen} onActionsModalClose={() => setActionsModalOpen(false)} appointment={selectedEvent} />

        </div>
    );
};



export default ScheduleScreen;
