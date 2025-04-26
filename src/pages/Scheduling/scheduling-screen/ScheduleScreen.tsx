import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar as BigCalendar, Views, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar as RsuiteCalendar, TagPicker, ButtonToolbar, Panel, InputGroup, SelectPicker, Input, IconButton, Button, Form, Drawer, Calendar, TagGroup, Tag, Divider, DatePicker, Checkbox, Modal, Avatar, Stack, } from "rsuite";
import "./styles.less";
import SearchIcon from '@rsuite/icons/Search';
import {
    newApAppointment,

} from '@/types/model-types-constructor';

import DetailIcon from '@rsuite/icons/Detail';
import SendIcon from '@rsuite/icons/Send';
import CharacterAuthorizeIcon from '@rsuite/icons/CharacterAuthorize';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useSelector } from 'react-redux';
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
import { useGetResourcesAvailabilityQuery, useGetResourcesQuery, useGetAppointmentsQuery } from '@/services/appointmentService';
import MyInput from '@/components/MyInput';
import Resources from "@/pages/appointment/resources";
import CalenderSimpleIcon from '@rsuite/icons/CalenderSimple';
import PlusIcon from '@rsuite/icons/Plus';
import ArrowLeftLineIcon from '@rsuite/icons/ArrowLeftLine';
import ArrowRightLineIcon from '@rsuite/icons/ArrowRightLine';

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
    const [showAppointmentOnly, setShowAppointmentOnly] = useState(false);
    const [filteredResourcesList, setFilteredResourcesList] = useState([])
    const [showCanceled, setShowCanceled] = useState<boolean>(false)
    const [filteredMonth, setFilteredMonth] = useState<Date>()
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [finalResourceLit, setFinalResourceLit] = useState();
    useEffect(() => {
        return () => {
            dispatch(setPageCode(''));
            dispatch(setDivContent("  "));
        };
    }, [location.pathname, dispatch]);
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
                    id: appointment?.key,
                    title: ` ${appointment?.patient?.fullName}, ${isNaN(dob) ? "Unknown" : today.getFullYear() - dob.getFullYear()
                        }Y , ${resource?.resourceName || "Unknown Resource"} `, // Customize title as needed
                    start: convertDate(appointment.appointmentStart),
                    end: convertDate(appointment.appointmentEnd),
                    text: appointment.notes || "No additional details available",
                    appointmentData: appointment,
                    hidden: isHidden,
                    resourceId: appointment?.resourceKey,
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
    ;
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

    const legendItems = [
        { label: 'No-Show', color: '#FDE68A' },      // أصفر
        { label: 'Checked In', color: '#FDBA74' },   // برتقالي فاتح
        { label: 'New', color: '#6366F1' },          // أزرق
        { label: 'Confirmed', color: '#34D399' },    // أخضر
        { label: 'Completed', color: '#93C5FD' },    // أزرق فاتح
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
        ? appointmentsData
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
            <div style={{marginInline:"15px"}} className="rbc-toolbar">
                <span className="rbc-btn-group">

                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '16px' }}>
                        <div style={{ borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center", width: "35px", height: "35px", backgroundColor: "#E3E4E8" }}>
                            <CalenderSimpleIcon style={{ fontSize: "17px" }} />
                        </div>

                        <strong style={{ fontSize: '23px', marginInline: '10px', color: "#2D3B4C" }}>{visibleAppointments.length}</strong>
                        <span style={{ fontSize: '16px', color: "#969FB0" }}>total appointments</span>
                    </div>
                </span>

                <div className="rbc-toolbar-label">
                    <button style={{ fontSize: "14px", margin: "7px", height: "35px" }} onClick={() => onNavigate("TODAY")}>Today</button>

                    <button style={{ margin: "7px", height: "35px" }} onClick={() => onNavigate("PREV")}><ArrowLeftLineIcon /></button>
                    <span

                        onClick={() => setDrowerOpen(true)}
                        style={{ fontSize: "14px", color: "#3B3E45", margin: "7px", cursor: "pointer", fontWeight: "bold" }}
                    >

                        {label}
                        {/* {drowerOpen ? <DatePicker value={filteredMonth} defaultOpen appearance="subtle" onChange={handleDateChange} format="yyyy-MM" /> : label} */}
                    </span>
                    <button style={{ margin: "7px", height: "35px" }} onClick={() => onNavigate("NEXT")}><ArrowRightLineIcon /></button>

                </div>
                <span className="rbc-btn-group">
                    <button style={{ fontSize: "14px" }} onClick={() => onView(Views.MONTH)}>Month</button>
                    <button style={{ fontSize: "14px" }} onClick={() => onView(Views.WEEK)}>Week</button>
                    <button style={{ fontSize: "14px" }} onClick={() => onView(Views.DAY)}>Day</button>
                    <button style={{ fontSize: "14px" }} onClick={() => onView(Views.AGENDA)}>Agenda</button>
                </span>
            </div>
        );
    };
    const getTooltipContent = (event) => {
        // based on the current view
        if (currentView === "month") {
            return `${event.title} - ${event.fromTo}`;
        } else {
            return `${event.title}`;
        }
    };

    const [value, setValue] = useState(new Date());
    const [currentCalView, setCurrentCalView] = useState("month"); // Force "month" view
    const divElement = useSelector((state: RootState) => state.div?.divElement);
    const divContent = (
        <div style={{ display: 'flex' }}>
            <h5>Scheduling</h5>
        </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('Schedule_Screen'));
    dispatch(setDivContent(divContentHTML));
    useEffect(() => {
        console.log(selectedEvent?.appointmentData.otherReason)
    }, [selectedEvent]);
    useEffect(() => {
        return () => {
            dispatch(setPageCode(''));
            dispatch(setDivContent("  "));
        };
    }, [location.pathname, dispatch])


    const practitioners = [
        { resourceId: 1, name: "Dr. Ahmad", avatar: "/avatars/ahmad.jpg" },
        { resourceId: 2, name: "Dr. Sara", avatar: "/avatars/sara.jpg" },
        { resourceId: 3, name: "Dr. Tarek", avatar: "/avatars/tarek.jpg" },
    ];



    const ResourceHeader = ({ resource }) => {
        console.log(resource);  // تحقق من البيانات هنا
        return (
            <div style={{ marginLeft: "5px", display: "flex", alignItems: "center", gap: "8px", height: "65px" }}>
                <Avatar size="md" circle src="https://i.pravatar.cc/150?u=1" />
                <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "14px" }} className="font-semibold text-sm">
                        {resource?.resourceName}
                    </div>
                    <div style={{ color: 'gray', fontSize: "12px" }}>{"Physician"}</div>
                </div>
            </div>
        );
    };

    const formats = {
        timeGutterFormat: (date, culture, localizer) =>
            localizer.format(date, 'h A', culture),
    };

    // const ResourceHeader = ({ label, resource }) => {
    //     return (
    //       <div className="flex items-center gap-2 p-1">
    //         <img
    //           src={resource?.avatarUrl || "/default-avatar.png"}
    //           alt="avatar"
    //           className="w-8 h-8 rounded-full object-cover"
    //         />
    //         <div>
    //           <div className="font-semibold text-sm">{label}</div>
    //           <div className="text-xs text-gray-500">{resource?.role || "Physician"}</div>
    //         </div>
    //       </div>
    //     );
    //   };


    const [copyEvent, setCopyEvent] = useState(true)
    const toggleCopyEvent = useCallback(() => setCopyEvent((val) => !val), [])







    const data = [
        { id: 1, name: 'Name', date: '20-01-2025', avatar: 'https://i.pravatar.cc/150?u=1' },
        { id: 2, name: 'Name', date: '20-01-2025', avatar: 'https://i.pravatar.cc/150?u=3' },
        { id: 3, name: 'Name', date: '20-01-2025', avatar: 'https://i.pravatar.cc/150?u=1' },
        { id: 4, name: 'Name', date: '20-01-2025', avatar: 'https://i.pravatar.cc/150?u=3' },
        { id: 5, name: 'Name', date: '20-01-2025', avatar: 'https://i.pravatar.cc/150?u=1' },
    ];
    const minTime = new Date();
    minTime.setHours(8, 0, 0);

    useEffect(() => {
        console.log(filteredResourcesList.length > 0 ? filteredResourcesList : !selectedResourceType?.resourcesType ? resourcesListResponse?.object : [])
    }, [filteredResourcesList, selectedResourceType])

    useEffect(() => {
        const selectedKeys = selectedResources?.resourceKey;
        const selectedTypeKey = selectedResourceType?.key;

        let finalList = filteredResourcesList;

        // فلترة حسب النوع
        if (selectedTypeKey) {
            finalList = finalList.filter(resource =>
                resource.resourceTypeLkey === selectedTypeKey
            );
        }

        // فلترة حسب الريسورس
        if (Array.isArray(selectedKeys) && selectedKeys.length > 0) {
            finalList = finalList.filter(resource =>
                selectedKeys.includes(resource.key)
            );
        }

        // ✅ إذا ما في داتا بعد الفلترة → استخدم resourcesListResponse.object
        if (!finalList || finalList.length === 0) {
            finalList = resourcesListResponse?.object || [];
        }

        setFinalResourceLit(finalList);
    }, [selectedResources, selectedResourceType, filteredResourcesList, resourcesListResponse]);





    useEffect(() => {
        console.log(resourceTypeQueryResponse?.object ?? [])
    }, [resourceTypeQueryResponse])

    return (
        <div   >
            <div style={{
                backgroundColor: 'rgba(250, 250, 250, 8)',
                position: 'relative',
                width: '100%',
                display: 'flex',
                justifyContent: "flex-start"
                // justifyContent: 'flex-end'
            }} className="inline-two-four-container">
                <Panel className="left-section" bordered>


                    {/* <RsuiteCalendar compact style={{ width: 320, height: 320 }} /> */}


                    <p style={{ color: 'gray', fontSize: "14px" }}>FILTERS</p>

                    <div >
                        <Form fluid layout="inline"  >
                            <MyInput
                                disabled
                                height={"40px"}
                                width={"15vw"}
                                vr={validationResult}
                                column
                                fieldLabel="City"
                                fieldType="select"
                                fieldName="durationLkey"
                                selectData={[]}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={undefined}
                            // record={appointment}
                            // setRecord={setAppoitment}
                            />
                        </Form>

                        <Form fluid layout="inline"  >

                            <MyInput
                                width={"15vw"}
                                height={"40px"}

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
                                height={"40px"}

                                width={"15vw"}
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
                                height={"40px"}

                                width={"15vw"}
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
                    </div>



                    <p style={{ color: 'gray', marginTop: '50px' }}>WAITING LIST</p>

                    <div style={{ width: '100%', height: 200, marginTop: 20, overflow: 'auto' }}>
                        {data.map((item) => (
                            <Panel key={item.id} style={{ marginBottom: 10 }}>
                                <div style={{ padding: 10 }}>
                                    <Stack direction="row" spacing={16}  >
                                        <Avatar circle src={item.avatar} alt="Avatar" />
                                        <div>
                                            <p style={{ margin: 0 }}>{item.name}</p>
                                            <p style={{ margin: 0 }}>{item.date}</p>
                                        </div>
                                    </Stack>
                                </div>
                            </Panel>
                        ))}
                    </div>

                </Panel>

                {/* =================== Right Side ============= */}

                <Panel bordered className="right-section">

                    <div style={{ marginTop: "27px", marginInline: "14px", display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        {/* Left  */}
                        <div>
                            <InputGroup inside
                                style={{
                                    width: '320px',
                                    // maxWidth: 350,
                                    height: 35,
                                    marginBottom: 10
                                }}>

                                <InputGroup.Button>
                                    <SearchIcon style={{ fontSize: '18px', marginRight: 10 }} />
                                </InputGroup.Button>
                                <Input placeholder="Search For Appointment" />
                            </InputGroup>

                        </div>

                        {/* Right  */}
                        <div>
                            <ButtonToolbar>
                                <IconButton appearance="ghost" style={{ width: "35%" }} icon={<SendIcon />}> View App Requests</IconButton>
                                <Button style={{
                                    width: "28%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                    borderRadius: "5px"
                                }}
                                     appearance="ghost"  >
                                    <FontAwesomeIcon icon={faPrint} style={{ marginRight: "25px", fontSize: "18px" }} />
                                    Print Report
                                </Button>
                                <IconButton onClick={() => { setModalOpen(true) }} appearance="primary" style={{ width: "32%" }} icon={<PlusIcon />}>Add Appointments</IconButton>

                            </ButtonToolbar>
                        </div>
                    </div>


                    <BigCalendar
                        style={{ height: "70vh" }}

                        min={minTime}
                        resourceIdAccessor="key"
                        resources={finalResourceLit}
                        formats={formats}
                        resourceTitleAccessor="resourceName"
                        localizer={localizer}
                        events={visibleAppointments}
                        step={60}
                        timeslots={1}
                        onSelectSlot={(slotInfo) => {
                            console.log("Selected slot:", slotInfo);
                            setModalOpen(true)
                        }}
                        startAccessor="start"
                        endAccessor="end"
                        views={["month", "week", "day", "agenda"]}
                        defaultView="day"
                        selectable={true}
                        onSelectEvent={(event) => {
                            handleSelectEvent(event);  // select event
                        }}
                        tooltipAccessor={(event) => getTooltipContent(event)} // Dynamic tooltip content
                        onView={(view) => setCurrentView(view)}

                        eventPropGetter={eventPropGetter}
                        components={{
                            toolbar: CustomToolbar,
                            resourceHeader: ResourceHeader,
                        }}
                        date={filteredMonth}
                    />

                    <br />
                    <Stack spacing={16} align="center">
                        {legendItems.map(({ label, color }) => (
                            <Stack spacing={6} align="center" key={label}>
                                <div
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 12,
                                        backgroundColor: color,
                                    }}
                                />
                                <span style={{ fontSize: "12px" }}>{label}</span>
                            </Stack>
                        ))}
                    </Stack>


                </Panel>
            </div>


            <AppointmentModal
                from={'Schedule'}
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

            <Modal open={showReasonModal} onClose={() => setShowReasonModal(false)}>
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
                            <Input value={selectedEvent?.appointmentData?.reasonLvalue?.lovDisplayVale ?? null} width={350} />

                        </div>
                        <br />
                        <div>
                            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                Other Reason
                            </label>
                            <Input value={selectedEvent?.appointmentData.otherReason} width={350} />

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
