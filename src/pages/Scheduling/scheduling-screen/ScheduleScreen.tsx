import React, { useEffect, useState } from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar as RsuiteCalendar, TagPicker,  ButtonToolbar, Panel, InputGroup, SelectPicker, Input,  } from "rsuite";
import "./styles.less";
import SearchIcon from '@rsuite/icons/Search';
import {
    newApAttachment,
    newApPatient,
} from '@/types/model-types-constructor';
import BlockIcon from '@rsuite/icons/Block';
import CheckIcon from '@rsuite/icons/Check';

import Translate from "@/components/Translate";

import {
    useGetFacilitiesQuery,
    useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { initialListRequest } from "@/types/types";
import AppointmentModal from "./AppoitmentModal";
import { ApPatient } from "@/types/model-types";

const ScheduleScreen = () => {
    const localizer = momentLocalizer(moment); // Set up moment as the date localizer
    const [validationResult, setValidationResult] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null); // To store selected event details
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedStartDate, setSelectedStartDate] = useState()

    const handleSelectSlot = (slotInfo) => {
        setSelectedSlot(slotInfo);
        setSelectedEvent(null); // Clear selected event when a new slot is selected
        setModalOpen(true);
    };

    useEffect(() => {
        if (selectedSlot) {
            setSelectedStartDate(selectedSlot?.slots[0])
        }
    }, [selectedSlot])
    const handleSelectEvent = (event) => {
        setSelectedEvent(event); // Set selected event details
        setSelectedSlot(null); // Clear selected slot when an event is selected
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);

    };

    const { data: facilityListResponse, refetch: refetchFacility } = useGetFacilitiesQuery({
        ...initialListRequest,
        pageSize: 1000
    });


    const eventsData = [
        {
            title: "Meeting with Team",
            start: new Date(2024, 10, 15, 10, 0), // Nov 15, 10 AM
            text: "Discussion about project milestones",
            end: new Date(2024, 10, 15, 11, 0),
        },
        {
            title: "Meeting with Team2",
            start: new Date(2024, 10, 15, 10, 30), // Nov 15, 10:30 AM
            text: "Follow-up on project progress",
            end: new Date(2024, 10, 15, 12, 0),
        },
        {
            title: "Doctor's Appointment",
            start: new Date(2024, 10, 16, 13, 0), // Nov 16, 1 PM
            text: "Routine check-up",
            end: new Date(2024, 10, 16, 14, 0),
        },
    ];

    const [events, setEvents] = useState(eventsData);

    const data = ['Eugenia', 'Bryan', 'Linda', 'Nancy', 'Lloyd', 'Alice', 'Julia', 'Albert'].map(
        item => ({ label: item, value: item })
    );
    const styles = { width: 300, display: 'block', marginBottom: 10 };

    const [open, setOpen] = React.useState(false);
    const [size, setSize] = React.useState();
    const handleOpen = value => {
        setSize(value);
        setOpen(true);
    };
    const handleClose = () => setOpen(false);
    const [selectedCriterion, setSelectedCriterion] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [quickPatientModalOpen, setQuickPatientModalOpen] = useState(false);
    const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
    const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');

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


    return (
        <div>
            <div className="inline-two-four-container">
                <div className="left-section">
                    <RsuiteCalendar compact style={{ width: 320, height: 320 }} />
                    <br />
                    <TagPicker size="lg" placeholder="Large" data={data} style={styles} />
                </div>
                <div className="right-section">
                    <BigCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        views={["month", "week", "day", "agenda"]}
                        defaultView="week"
                        selectable={true}
                        onSelectEvent={handleSelectEvent}
                        onSelectSlot={handleSelectSlot}
                        style={{ height: 600 }}
                    />
                </div>
            </div>


            <AppointmentModal isOpen={modalOpen}  onClose={()=>setModalOpen(false)}  startAppoitmentStart ={selectedStartDate} />


        </div>
    );
};

BlockIcon
CheckIcon

export default ScheduleScreen;
