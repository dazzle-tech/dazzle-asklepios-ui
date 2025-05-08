import MyInput from "@/components/MyInput";
import Translate from "@/components/Translate";
import QuickPatient from "@/pages/patient/facility-patient-list/QuickPatient";
import { ApAppointment, ApPatient } from "@/types/model-types";
import { newApAppointment, newApPatient } from "@/types/model-types-constructor";
import { faBolt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { Button, ButtonToolbar, Col, DatePicker, Divider, Drawer, FlexboxGrid, Form, Grid, IconButton, Input, InputGroup, Modal, Pagination, Panel, Placeholder, Row, SelectPicker, Stack, Table } from "rsuite";
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
import { useAppDispatch, useAppSelector } from "@/hooks";
import { useChangeAppointmentStatusMutation, useGetResourcesAvailabilityQuery, useGetResourcesQuery, useSaveAppointmentMutation } from "@/services/appointmentService";
import AttachmentModal from "@/components/AttachmentUploadModal/AttachmentUploadModal";
import { object } from "prop-types";
import { setPatient } from "@/reducers/patientSlice";
import { notify } from "@/utils/uiReducerActions";
import MyCard from "@/components/MyCard";
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';



const AppointmentModal = ({ isOpen, onClose, resourceType, facility, onSave, appointmentData, showOnly, from }) => {


    useEffect(() => {


        if (appointmentData) {
            setAppoitment(appointmentData)
            console.log(appointmentData?.patient)
            setLocalPatient(appointmentData?.patient)
        } else {
            setAppoitment(newApAppointment)
            setLocalPatient(newApPatient)
        }
    }, [appointmentData])

    useEffect(() => {
        if (showOnly) {

            // console.log(showOnly)
        }
    }, [showOnly])
    const patientSlice = useAppSelector(state => state.patient);

    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);

    const [quickPatientModalOpen, setQuickPatientModalOpen] = useState(false);
    const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
    const [appointment, setAppoitment] = useState<ApAppointment>({ ...newApAppointment })
    const [resourcesListRequest, setResourcesListRequest] = useState<ListRequest>({ ...initialListRequest });
    const dispatch = useAppDispatch();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null); // To store selected event details
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [validationResult, setValidationResult] = useState({});
    const [selectedCriterion, setSelectedCriterion] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [patientSearchTarget, setPatientSearchTarget] = useState('primary'); // primary, relation, etc..
    const [searchResultVisible, setSearchResultVisible] = useState(false);
    const [patientAge, setPatientAge] = useState({ patientAge: null })
    const [reRenderModal, setReRenderModal] = useState(true)
    const [instructionKey, setInstructionsKey] = useState()
    const [instructionValue, setInstructionsValue] = useState()
    const [instructions, setInstructions] = useState()
    const [availabilDays, setAvailabilDays] = useState()
    const [availablePeriods, setAvailablePeriods] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [availableDatesInMonth, setAvailableDatesInMonth] = useState(null);
    const [selectedMonthDay, setSelectedMonthDay] = useState(null);
    const [selectedPeriods, setSelectedPeriods] = useState(null);
    const [availableTimes, setAvailableTimes] = useState(null);
    const [selectedDuration, setSelectedDuration] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [rowPeriods, setRowPeriods] = useState()
    const [filteredResourcesList, setFilteredResourcesList] = useState([])
    const [filteredDates, setFilteredDates] = useState([]);


    const { data: resourcesAvailability } = useGetResourcesAvailabilityQuery({
        resource_key: appointment?.resourceKey,
        facility_id: "",
    });
    useEffect(() => {
        if (appointmentData?.appointmentStart) {
            const date = new Date(appointmentData?.appointmentStart);
            setSelectedYear(date.getFullYear());
            setSelectedMonth(date.getMonth());
            setSelectedMonthDay(date.getDate());
            setSelectedTime(date);
        }
    }, [appointmentData?.appointmentStart]);

    useEffect(() => {
        console.log(selectedMonthDay)
        console.log(appointment?.resourceKey)
        console.log(rowPeriods)
        console.log(availabilDays)

    }, [selectedMonthDay, appointment])


    useEffect(() => {
        setRowPeriods(resourcesAvailability?.object)
    }, [resourcesAvailability?.object, appointment?.resourceKey])


    useEffect(() => {
        filterWeekDays(rowPeriods)
    }, [rowPeriods])

    const dayOptions = availablePeriods.map((item) => ({
        label: item.day,
        value: item.day,
    }));
    const { data: resourcesListResponse } = useGetResourcesQuery(resourcesListRequest);

    useEffect(() => {
        if (appointment?.resourceTypeLkey) {
            const filtered = resourcesListResponse.object.filter(resource => resource.resourceTypeLkey === appointment?.resourceTypeLkey);
            setFilteredResourcesList(filtered);
        }
    }, [resourcesListResponse, appointment?.resourceTypeLkey]);

    //   const [availabilityPickerData, setAvailabilityPickerData] = useState()
    // const [availableDayAndPeriods, setAvailableDayAndPeriods] = useState([]);
    // const [selectedDay, setSelectedDay] = useState(null);
    // const [availablePeriods, setAvailablePeriods] = useState([]);
    // const dayOptions = availablePeriods.map((item) => ({
    //     label: item.day,
    //     value: item.day,
    // }));


    const handleDayChange = (day) => {
        setSelectedDay(day);

        // Find the selected day's periods
        const selectedDayData = availablePeriods.find(
            (item) => item.day === day
        );
        if (selectedDayData) {
            const periods = selectedDayData.periods.map((period, index) => ({
                label: `${formatTime(period.startTime)} - ${formatTime(period.endTime)}`,
                value: index, // Using index as a unique key for simplicity
            }));
            setAvailablePeriods(periods);
        } else {
            setAvailablePeriods([]);
        }
    };
    const { Column, HeaderCell, Cell } = Table;


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
        console.log("patientslice", patientSlice)
        console.log(patientSlice.patient)

        if (patientSlice?.patient) {
            setLocalPatient(patientSlice?.patient);
        }
    }, [patientSlice]);





    const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
    const { data: resourceTypeQueryResponse } = useGetLovValuesByCodeQuery('BOOK_RESOURCE_TYPE');
    const { data: instractionsTypeQueryResponse } = useGetLovValuesByCodeQuery('APP_INSTRUCTIONS')
    const { data: priorityQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY')
    const { data: procedureLevelQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_LEVEL')
    const { data: reminderTypeLovQueryResponse } = useGetLovValuesByCodeQuery('REMINDER_TYP');
    const { data: durationLovQueryResponse } = useGetLovValuesByCodeQuery('APNTMNT_DURATION');
    const { data: weekDaysLovQueryResponse } = useGetLovValuesByCodeQuery('DAYS_OF_WEEK');

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
        console.log('closing model')
    };

    const handleClear = () => {
        setLocalPatient(newApPatient)
        setAppoitment(newApAppointment)
        setPatientAge(null)
        setValidationResult(undefined);
        setReRenderModal(!reRenderModal)
        setInstructions(null)
        setInstructionsKey(null)
        setInstructionsValue(null)
    }
    useEffect(() => {
        calculateAge(localPatient?.dob)
        console.log(patientSlice.patient)
        console.log(localPatient)
        if (from === 'Encounter') {
            setLocalPatient(patientSlice.patient);
        }
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

        toggleSidebar()
        setPatientSearchTarget(target);
        // setSearchResultVisible(true);

        if (searchKeyword && searchKeyword.length >= 3 && selectedCriterion?.value) {
            setListRequest({
                ...listRequest,
                ignore: false,
                filters: [
                    {
                        fieldName: fromCamelCaseToDBName(selectedCriterion?.value),
                        operator: 'containsIgnoreCase',
                        value: searchKeyword,
                    },
                ]
            });
        }
    };


    const conjurePatientSearchBar = target => {
        return (
            <div style={{ maxWidth: 450 }}>
                <Form layout="inline" fluid>
                    <div style={{
                        display: 'flex',
                        width: '100%',
                        gap: '12px',
                        alignItems: 'flex-end'
                    }}>

                        {/* Search Criteria */}
                        <MyInput
                            width={150}
                            height="40px"
                            required
                            vr={validationResult}
                            column
                            fieldLabel="Search Criteria"
                            fieldType="select"
                            fieldName="value"
                            selectData={searchCriteriaOptions ?? []}
                            selectDataLabel="label"
                            selectDataValue="value"
                            record={selectedCriterion}
                            setRecord={setSelectedCriterion}
                        />

                        {/* Search Patients */}
                        <div style={{ flex: 1 }}>
                            <Form.Group controlId="search">
                                <Form.ControlLabel>Search Patients</Form.ControlLabel>
                                <InputGroup inside style={{ height: "40px", width: '100%', direction: 'ltr' }}>
                                    <Input
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                search(target);
                                            }
                                        }}
                                        placeholder="Search Patients"
                                        value={searchKeyword}
                                        onChange={e => setSearchKeyword(e)}
                                    />
                                    <InputGroup.Button onClick={() => search(target)}>
                                        <SearchIcon />
                                    </InputGroup.Button>
                                </InputGroup>
                            </Form.Group>
                        </div>

                    </div>
                </Form>
            </div>

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
        setAppoitment({ ...appointment, reminderLkey: null })
    }, [appointment?.isReminder])

    useEffect(() => {
        console.log(resourceTypeQueryResponse)
    }, [resourceTypeQueryResponse])

    useEffect(() => {
        if (appointmentData) {
            setAppoitment({ ...appointment, patientKey: localPatient?.key })

        }

    }, [localPatient])

    useEffect(() => {
        if (instructionKey?.instructionsLkey) {
            const filtered = instractionsTypeQueryResponse.object
                .filter((item) => item.key === instructionKey?.instructionsLkey)
                .map((item) => item.lovDisplayVale);
            setInstructionsValue(filtered)
        }
    }, [instructionKey])

    useEffect(() => {
        if (instructionValue) {
            setInstructions(prevInstructions =>
                prevInstructions ? `${prevInstructions}, ${instructionValue}` : instructionValue[0]
            );
        }
        setInstructionsKey(null)
    }, [instructionValue]);

    useEffect(() => {
        if (resourceType)
            setAppoitment({ ...appointment, resourceTypeLkey: resourceType?.resourcesType })


    }, [resourceType])

    useEffect(() => {

        if (facility)
            setAppoitment({ ...appointment, facilityKey: facility?.facilityKey })

    }, [facility])

    const calculateAppointmentDate = (duration) => {
        const date = new Date();
        const year = selectedYear || date.getFullYear();
        const month = selectedMonth || date.getMonth();
        const day = selectedMonthDay;
        const time = new Date(selectedTime);
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const mergedDateTime = new Date(year, month, day, hours, minutes);

        // Add duration if provided , to be updated later on another jira
        if (duration) {
            mergedDateTime.setMinutes(mergedDateTime.getMinutes() + parseInt(duration, 10));
        }
        return mergedDateTime;
    };

    const handleSaveAppointment = () => {
        if (localPatient?.key) {
            console.log({
                ...appointment,
                patientKey: localPatient.key,
                appointmentStart: calculateAppointmentDate(0),
                appointmentEnd: calculateAppointmentDate(selectedDuration),
                instructions: instructions,
                appointmentStatus: appointment.appointmentStatus
                    ? appointment.appointmentStatus
                    : "New-Appointment",
            });

            saveAppointment({
                ...appointment,
                patientKey: localPatient.key,
                appointmentStart: calculateAppointmentDate(0),
                appointmentEnd: calculateAppointmentDate(selectedDuration),
                instructions: instructions,
                appointmentStatus: appointment.appointmentStatus
                    ? appointment.appointmentStatus
                    : "New-Appointment",
            })
                .unwrap()
                .then(() => {
                    closeModal();
                    handleClear();
                    onSave();
                })
                .catch((e) => {
                    if (e.status === 422) {
                        console.log("Validation error: Unprocessable Entity", e);
                        dispatch(notify({ msg: 'The patient already has an appointment on this day.', sev: 'warn' }));

                    } else {
                        console.log("An unexpected error occurred", e);
                        dispatch(notify({ msg: '"An unexpected error occurred', sev: 'warn' }));

                    }
                });
        } else {
            dispatch(notify({ msg: 'Please make sure to fill in the required fields.', sev: 'warn' }));

        }

    }

    const getAvailableDatesInMonth = (dayOfWeek, year, month) => {
        const dates = [];
        const firstDay = new Date(year, month, 1);
        const totalDays = new Date(year, month + 1, 0).getDate();

        for (let i = 1; i <= totalDays; i++) {
            const currentDate = new Date(year, month, i);
            if (currentDate.toLocaleDateString('en-US', { weekday: 'long' }) === dayOfWeek) {
                dates.push(i);
            }
        }
        return dates;
    };



    const filterWeekDays = (periodsData) => {
        const result = {};
        console.log(periodsData)

        periodsData?.forEach((item) => {
            const resourceKey = item.resourceKey;
            const day = item.dayLvalue?.lovDisplayVale;
            const period = {
                startTime: item.startTime,
                endTime: item.endTime,
            };

            if (!result[resourceKey]) result[resourceKey] = {};
            if (!result[resourceKey][day]) result[resourceKey][day] = [];
            result[resourceKey][day].push(period);
        });

        const availabilityPickerData = Object.entries(result).flatMap(([resourceKey, days]) =>
            Object.entries(days).map(([day, periods]) => ({
                label: `${day} (${periods.length} periods)`,
                value: `${resourceKey}-${day}`,
                periods: periods,
            }))
        );
        console.log(availabilityPickerData ?? [])

        setAvailabilDays(availabilityPickerData ?? []);
    };




    useEffect(() => {
        console.log("Available Days:", availabilDays);

        if (availabilDays?.length) {
            console.log("Available Days:", availabilDays);
        }
    }, [availabilDays]);

    const mergePeriods = (periods) => {
        if (!periods || !periods.length) return [];

        const merged = [];
        periods.sort((a, b) => a.startTime - b.startTime);
        let current = { ...periods[0] };

        for (let i = 1; i < periods.length; i++) {
            if (periods[i].startTime <= current.endTime) {
                current.endTime = Math.max(current.endTime, periods[i].endTime);
            } else {
                merged.push(current);
                current = { ...periods[i] };
            }
        }
        merged.push(current);
        return merged;
    };




    const handleSelectDayOfWeek = (selectedDay) => {
        setSelectedDay(selectedDay)
        const dayOfWeek = selectedDay.split('-')[1];
        const selectedPeriods = availabilDays?.find(item => item.value === selectedDay)?.periods || [];
        const mergedPeriods = mergePeriods(selectedPeriods);
        setSelectedPeriods(mergedPeriods);


        const today = new Date();
        const availableDates = getAvailableDatesInMonth(dayOfWeek, today.getFullYear(), today.getMonth());
        setAvailableDatesInMonth(availableDates);


        const availableTimes = generateTimes(mergedPeriods, 30); // 30 دقيقة كفاصل زمني
        setAvailableTimes(availableTimes);
    };
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const generateTimes = (periods, interval = 30) => {
        const times = [];
        periods.forEach((period) => {
            let current = period.startTime;
            while (current < period.endTime) {
                times.push(current);
                current += interval * 60;
            }
        });
        return times;
    };


    // get available houers
    const availableHours = rowPeriods?.flatMap((period) => {
        const startHour = Math.floor(period.startTime / 3600);
        const endHour = Math.floor(period.endTime / 3600);
        return Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
    });

    const isHourAvailable = (hour) => {
        const selectedDayName = selectedDay.split('-')[1];
        if (!selectedDayName || !availabilDays.some(day => day.label.includes(selectedDayName))) {
            return false;
        }

        const periods = availabilDays.find(day => day.label.includes(selectedDayName)).periods;

        return periods.some((period) => {
            const startHour = Math.floor(period.startTime / 3600);
            const endHour = Math.floor(period.endTime / 3600);
            return hour >= startHour && hour < endHour;
        });
    };

    const isMinuteAvailable = (hour, minute) => {
        const selectedDayName = selectedDay.split('-')[1];

        if (!selectedDayName || !availabilDays.some(day => day.label.includes(selectedDayName))) {
            return true;
        }

        const periods = availabilDays.find(day => day.label.includes(selectedDayName)).periods;
        let isAvailable = true;

        periods.forEach((period) => {
            const startTime = period.startTime; // وقت بداية الفترة بالثواني
            const endTime = period.endTi
            const periodStartHour = Math.floor(startTime / 3600)
            const periodStartMinute = Math.floor((startTime % 3600) / 60);
            const periodEndHour = Math.floor(endTime / 3600);
            const periodEndMinute = Math.floor((endTime % 3600) / 60);

            // تحويل الساعة والدقيقة المختارة إلى ثواني
            const selectedTimeInSeconds = hour * 3600 + minute * 60;

            // التحقق إذا كانت الدقيقة تقع ضمن فترة زمنية محددة
            if (selectedTimeInSeconds >= startTime && selectedTimeInSeconds < endTime) {
                isAvailable = false; // إذا كانت ضمن فترة زمنية، أغلق الدقيقة
            }
        });

        return isAvailable;
    };

    const generateAvailableMinutes = (hour) => {
        const matchingPeriods = periods.filter(
            (period) => hour >= Math.floor(period.startTime / 3600) && hour < Math.floor(period.endTime / 3600)
        );

        const minutes = [];
        matchingPeriods.forEach((period) => {
            const startMinute = Math.floor((period.startTime % 3600) / 60);
            const endMinute = Math.floor((period.endTime % 3600) / 60);
            for (let minute = startMinute; minute < endMinute; minute += 15) {
                minutes.push(minute);
            }
        });

        return minutes;
    };



    useEffect(() => {
        if (appointment?.durationLkey) {
            const duration = durationLovQueryResponse.object.find(
                (item) => item.key === appointment?.durationLkey
            )
            const firstTwoChars = duration.lovDisplayVale.slice(0, 2);

            console.log(firstTwoChars)
            setSelectedDuration(firstTwoChars)
        }

    }, [appointment?.durationLkey])


    useEffect(() => {
        console.log(availableDatesInMonth)
    }, [availableDatesInMonth])

    useEffect(() => {
        const today = new Date();
        const currentDay = today.getDate();

        // تصفية الأيام المتاحة لاستبعاد الأيام التي مضت
        const futureDates = availableDatesInMonth?.filter(date => date >= currentDay);
        setFilteredDates(futureDates);
    }, [availableDatesInMonth]);
    const [showResults, setShowResults] = useState(false);
    const [shifted, setShifted] = useState(false);        // يتحكم بفتح/إغلاق السايد بار
    const [showContent, setShowContent] = useState(false); // يتحكم بظهور المحتوى بعد الفتح

    const [isSideSearchOpen, setIsSideSearchOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSideSearchOpen(!isSideSearchOpen);
    };

    useEffect(() => {
        console.log(patientListResponse?.object)
    }, [patientListResponse])



    return (

        <div>


            <Modal key={reRenderModal} size={1600} open={
                isOpen
            } onClose={closeModal}>
                {/* <Modal.Header>
                    <Modal.Title>Add Appointment</Modal.Title>
                </Modal.Header> */}

                <Modal.Body>


                    <div className={`container ${!isSideSearchOpen ? "left-closed" : ""}`}>
                        <div className={`left ${isSideSearchOpen ? 'open' : 'closed'}`}>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    padding: '16px',
                                    maxHeight: '700px',
                                    overflowY: 'auto',
                                    backgroundColor: '#F5F7FB',
                                    borderRadius: '12px',
                                }}
                            >
                                {isFetchingPatients ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                height: 160,
                                                backgroundColor: '#e0e0e0',
                                                borderRadius: '12px',
                                                padding: '16px'
                                            }}
                                        >
                                            <Placeholder.Paragraph rows={3} active />
                                        </div>
                                    ))
                                ) : patientListResponse?.object?.length > 0 ? (
                                    patientListResponse.object.map((patient, index) => (
                                        <div key={index} style={{ flexShrink: 0 }}>
                                            <MyCard
                                                height={160}
                                                showArrow={true}
                                                key={patient.key}
                                                variant="profile"
                                                leftArrow={false}
                                                avatar={
                                                    patient?.attachmentProfilePicture?.fileContent
                                                        ? `data:${patient?.attachmentProfilePicture?.contentType};base64,${patient?.attachmentProfilePicture?.fileContent}`
                                                        : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
                                                }
                                                title={patient.fullName}
                                                contant={
                                                    <>
                                                        {patient.createdAt
                                                            ? new Date(patient?.createdAt).toLocaleString('en-GB')
                                                            : ''}
                                                    </>
                                                }
                                                showMore={true}
                                                arrowClick={() => {
                                                    handleSelectPatient(patient);
                                                    setSearchKeyword(null);
                                                    toggleSidebar();
                                                }}
                                                footerContant={`# ${patient.patientMrn}`}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    // No Data case 
                                    <MyCard
                                    height={160}
                                    showArrow={false}
                                    avatar={
                                      <div
                                        style={{
                                          width: 48,
                                          height: 48,
                                          borderRadius: '50%',
                                          backgroundColor: '#D3D3D3',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: 24,
                                          color: '#555',
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        !
                                      </div>
                                    }
                                    title="No patient found"
                                    contant={`No patient found matching the entered ${searchCriteriaOptions.find(opt => opt.value === selectedCriterion?.value)?.label || 'criteria'}.`}
                                  />
                                )}
                            </div>


                            {/* {patientListResponse?.object?.map(patient => (
                                <MyCard
                                    width={250}
                                    showArrow={true}
                                    key={patient.key}
                                    variant='profile'
                                    leftArrow={false}
                                    avatar={patient?.attachmentProfilePicture?.fileContent
                                        ? `data:${patient?.attachmentProfilePicture?.contentType};base64,${patient?.attachmentProfilePicture?.fileContent}`
                                        : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'}
                                    title={patient.fullName}
                                    contant={
                                        <>
                                            {patient.createdAt ? new Date(patient?.createdAt).toLocaleString('en-GB') : ''}{' '}
                                        </>
                                    }
                                    showMore={true}
                                    arrowClick={() => {
                                        handleSelectPatient(patient);
                                        setSearchKeyword(null);
                                        handleClose();
                                    }}
                                    footerContant={`# ${patient.patientMrn}`}
                                />
                            ))} */}


                        </div>


                        <div className="right">

                            <div className="content-wrapper">
                                <div className="left-input">
                                    {from === 'Schedule' &&
                                        <Panel>
                                            <div className="show-grid">
                                                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                                                    <div style={{ flex: 3, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        {conjurePatientSearchBar('primary')}
                                                    </div>
                                                    <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <div style={{ flexShrink: 0, marginTop: "22px" }}>
                                                            <Button
                                                                appearance="ghost"
                                                                style={{
                                                                    height: "40px",
                                                                    border: '1px solid #2264E5',
                                                                    color: "#2264E5"
                                                                }}
                                                                onClick={() => setQuickPatientModalOpen(true)}
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={faBolt}
                                                                    style={{ color: "#2264E5", marginRight: "10px", fontSize: "16px" }}
                                                                />
                                                                <span>Quick Patient</span>
                                                            </Button>

                                                            <QuickPatient
                                                                open={quickPatientModalOpen}
                                                                setOpen={() => setQuickPatientModalOpen(false)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Panel>


                                    }
                                    <br />
                                    <Panel   //  ===================== > Patient Information < ===================== 

                                        header={
                                            <p style={{ fontSize: '12px', color: '#A1A9B8', fontWeight: 600 }}>
                                                <Translate>Patient Information</Translate>
                                            </p>
                                        }
                                    >
                                        <Form
                                            layout="inline" fluid>



                                            <div className="show-grid">
                                                <div style={{ display: "flex", gap: "10px", width: "100%" }}>

                                                    <div style={{ flex: 1, padding: 2, backgroundColor: "#F5F7FB" }}>
                                                        <MyInput
                                                            height={35}
                                                            width={"100%"}
                                                            vr={validationResult}
                                                            column
                                                            fieldLabel="MRN"
                                                            fieldName="patientMrn"
                                                            record={localPatient}
                                                            setRecord={setLocalPatient}
                                                            disabled
                                                        />
                                                    </div>

                                                    {/* Second column - Other fields */}
                                                    <div style={{ flex: 6, display: "flex", gap: "10px", padding: 2 }}>
                                                        <div style={{ flex: 2, backgroundColor: "#F5F7FB" }}> {/* Color: White */}
                                                            <MyInput
                                                                height={35}
                                                                width={"100%"}
                                                                vr={validationResult}
                                                                column
                                                                fieldName="fullName"
                                                                record={localPatient}
                                                                setRecord={setLocalPatient}
                                                                disabled
                                                            />
                                                        </div>
                                                        <div style={{ flex: 1, backgroundColor: "#F5F7FB" }}>
                                                            <MyInput
                                                                height={35}
                                                                required
                                                                width={"100%"}
                                                                vr={validationResult}
                                                                column
                                                                fieldName="documentNo"
                                                                record={localPatient}
                                                                setRecord={setLocalPatient}
                                                                disabled
                                                            />
                                                        </div>
                                                        <div style={{ flex: 1, backgroundColor: "#F5F7FB" }}>
                                                            <MyInput
                                                                height={35}
                                                                width={"100%"}
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
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>

                                        </Form>


                                        <Form layout="inline" fluid>


                                            <div className="show-grid">
                                                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                                                    <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <MyInput
                                                            width={"100%"}
                                                            height={35}

                                                            fieldLabel="Patient Age"
                                                            vr={validationResult}
                                                            column
                                                            fieldName="patientAge"
                                                            record={patientAge}
                                                            setRecord={setPatientAge}
                                                            disabled
                                                        />
                                                    </div>
                                                    <div style={{ flex: 3, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <MyInput
                                                            // vr={validationResult}
                                                            width={"100%"}
                                                            height={35}
                                                            column
                                                            fieldType="date"
                                                            fieldLabel="Birth date"
                                                            fieldName="dob"
                                                            record={localPatient}
                                                            setRecord={setLocalPatient}
                                                            disabled
                                                        />
                                                    </div>
                                                    <div style={{ flex: 3, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <MyInput
                                                            width={"100%"}
                                                            height={35}

                                                            required
                                                            vr={validationResult}
                                                            column
                                                            fieldLabel="Sex At birth"
                                                            fieldType="select"
                                                            fieldName="genderLkey"
                                                            selectData={genderLovQueryResponse?.object ?? []}
                                                            selectDataLabel="lovDisplayVale"
                                                            selectDataValue="key"
                                                            record={localPatient}
                                                            setRecord={setLocalPatient}
                                                            disabled
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </Form>

                                        <Form layout="inline" fluid>

                                            <div className="show-grid">
                                                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                                                    <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <MyInput
                                                            width={"100%"}
                                                            height={35}
                                                            vr={validationResult}
                                                            column
                                                            fieldName="mobileNumber"
                                                            record={localPatient}
                                                            setRecord={setLocalPatient}
                                                            disabled
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <MyInput
                                                            height={35}
                                                            width={"100%"}
                                                            vr={validationResult}
                                                            column
                                                            fieldName="email"
                                                            record={localPatient}
                                                            setRecord={setLocalPatient}
                                                            disabled
                                                        />
                                                    </div>

                                                </div>
                                            </div>
                                        </Form>
                                    </Panel>

                                    <Panel

                                        header={
                                            <p style={{ fontSize: '12px', color: '#A1A9B8', fontWeight: 600 }}>
                                                <Translate>Visit Details</Translate>
                                            </p>
                                        } >

                                        <Form layout="inline" fluid>

                                            <div className="show-grid">
                                                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                                                    <div style={{ flex: 2, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <MyInput
                                                            height={35}
                                                            disabled
                                                            width={"100%"}
                                                            vr={validationResult}
                                                            column
                                                            fieldLabel="City"
                                                            fieldType="select"
                                                            fieldName="durationLkey"
                                                            selectData={[]}
                                                            selectDataLabel="lovDisplayVale"
                                                            selectDataValue="key"
                                                        />
                                                    </div>
                                                    <div style={{ flex: 4, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <MyInput
                                                            height={35}
                                                            width={"100%"}

                                                            column
                                                            fieldLabel="Facility"
                                                            selectData={facilityListResponse?.object ?? []}
                                                            fieldType="select"
                                                            selectDataLabel="facilityName"
                                                            selectDataValue="key"
                                                            fieldName="facilityKey"
                                                            disabled={showOnly}
                                                            record={appointment}
                                                            setRecord={setAppoitment}
                                                        />
                                                    </div>

                                                </div>
                                            </div>



                                            <div className="show-grid">
                                                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                                                    <div style={{ flex: 2, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <MyInput
                                                            height={35}
                                                            disabled={showOnly}
                                                            required
                                                            width={195}
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
                                                    </div>
                                                    <div style={{ flex: 4, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <MyInput
                                                            height={35}
                                                            disabled={showOnly}
                                                            width={380}
                                                            column
                                                            fieldLabel="Resources"
                                                            selectData={filteredResourcesList.length > 0 ? filteredResourcesList : !appointment?.resourceTypeLkey ? resourcesListResponse?.object : []}
                                                            fieldType="select"
                                                            selectDataLabel="resourceName"
                                                            selectDataValue="key"
                                                            fieldName="resourceKey"
                                                            record={appointment}
                                                            setRecord={setAppoitment}
                                                        />
                                                    </div>

                                                </div>
                                            </div>

                                            <div className="show-grid">
                                                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                                                    <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <MyInput
                                                            height={35}
                                                            required
                                                            width={"100%"}
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
                                                            disabled={showOnly}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <MyInput
                                                            height={35}
                                                            required
                                                            width={"100%"}
                                                            vr={validationResult}
                                                            column
                                                            fieldLabel="Duration"
                                                            fieldType="select"
                                                            fieldName="durationLkey"
                                                            selectData={durationLovQueryResponse?.object ?? []}
                                                            selectDataLabel="lovDisplayVale"
                                                            selectDataValue="key"
                                                            record={appointment}
                                                            setRecord={setAppoitment}
                                                            disabled={showOnly}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1, height: "35px", display: "flex", width: "100%", marginTop: "30px", backgroundColor: "#F5F7FB" }}>
                                                        <IconButton
                                                            disabled={(!localPatient?.key) || showOnly}
                                                            color="cyan"
                                                            style={{ width: "100%" }}
                                                            appearance="primary"
                                                            icon={<DocPassIcon />}
                                                        >
                                                            Add To Waiting List
                                                        </IconButton>
                                                    </div>
                                                </div>
                                            </div>



                                        </Form>
                                    </Panel>

                                </div>
                                <div className="right-output">


                                    {/* 
                                    <div className="show-grid">
                                        <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                                            <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                md=4 (أو أي محتوى)
                                            </div>
                                            <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                md=6 (أو أي محتوى)
                                            </div>
                                            <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                md=6 smHidden (أو أي محتوى)
                                            </div>
                                        </div>
                                    </div> 
                                    */}

                                    {/* === Appointment Date & Time Selector UI === */}
                                    <Panel

                                        header={
                                            <p style={{ fontSize: '12px', color: '#A1A9B8', fontWeight: 600 }}>
                                                <Translate>Schedule Appointment</Translate>
                                            </p>
                                        } >
                                        <Form layout="inline" fluid>
                                            <div className="show-grid">
                                                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                                                    <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <div>
                                                            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                                                Year
                                                            </label>
                                                            <SelectPicker
                                                                disabled={showOnly}
                                                                style={{ width: "100%" }}
                                                                data={Array.from({ length: 5 }, (_, index) => {
                                                                    const year = new Date().getFullYear() + index;
                                                                    return { label: year.toString(), value: year };
                                                                })}
                                                                defaultValue={new Date().getFullYear()}
                                                                onChange={(selectedYear) => {
                                                                    setSelectedYear(selectedYear);
                                                                    updateAvailableDates(selectedYear, selectedMonth);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>

                                                        <div>
                                                            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                                                Month
                                                            </label>
                                                            <SelectPicker
                                                                disabled={showOnly}
                                                                style={{ width: "100%" }}
                                                                data={[
                                                                    { label: "January", value: 0 },
                                                                    { label: "February", value: 1 },
                                                                    { label: "March", value: 2 },
                                                                    { label: "April", value: 3 },
                                                                    { label: "May", value: 4 },
                                                                    { label: "June", value: 5 },
                                                                    { label: "July", value: 6 },
                                                                    { label: "August", value: 7 },
                                                                    { label: "September", value: 8 },
                                                                    { label: "October", value: 9 },
                                                                    { label: "November", value: 10 },
                                                                    { label: "December", value: 11 },
                                                                ]}
                                                                defaultValue={new Date().getMonth()}
                                                                onChange={(selectedMonth) => {
                                                                    setSelectedMonth(selectedMonth);
                                                                    updateAvailableDates(selectedYear, selectedMonth);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <div>
                                                            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                                                Week Day
                                                            </label>
                                                            <SelectPicker
                                                                disabled={showOnly}
                                                                style={{ width: "100%" }}
                                                                data={availabilDays ? availabilDays.map(item => ({ label: item.label, value: item.value })) : []}
                                                                onChange={handleSelectDayOfWeek}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>



                                            <div className="show-grid">
                                                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                                                    <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <div>
                                                            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                                                Month Day
                                                            </label>
                                                            <SelectPicker
                                                                disabled={!(availableDatesInMonth?.length > 0) || showOnly}
                                                                style={{ width: "100%" }}
                                                                data={filteredDates?.map(date => ({
                                                                    label: `Day ${date}`,
                                                                    value: date,
                                                                }))}
                                                                placeholder="Select a day"
                                                                onChange={setSelectedMonthDay}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <div>
                                                            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                                                Time
                                                            </label>
                                                            <DatePicker
                                                                style={{ width: "100%" }}
                                                                disabled={!selectedMonthDay}
                                                                format="HH:mm"
                                                                ranges={[]}
                                                                shouldDisableHour={(hour) => !isHourAvailable(hour)}
                                                                shouldDisableMinute={(minute, selectedHour) => !isMinuteAvailable(selectedHour, minute)}
                                                                onChange={(value) => setSelectedTime(value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </Form>
                                    </Panel>

                                    <Panel
                                        header={
                                            <p style={{ fontSize: '12px', color: '#A1A9B8', fontWeight: 600 }}>
                                                <Translate>Additional Information</Translate>
                                            </p>
                                        } >

                                        <Form layout="inline" fluid>
                                            <>


                                                <div className="show-grid">
                                                    <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                                                        <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                            <MyInput
                                                                disabled={showOnly}
                                                                required
                                                                width={"100%"}
                                                                vr={validationResult}
                                                                column
                                                                fieldLabel="Instructions"
                                                                fieldType="select"
                                                                fieldName="instructionsLkey"
                                                                selectData={instractionsTypeQueryResponse?.object ?? []}
                                                                selectDataLabel="lovDisplayVale"
                                                                selectDataValue="key"
                                                                record={instructionKey}
                                                                setRecord={setInstructionsKey}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "flex", width: "100%" }}>
                                                        <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                            <Input
                                                                as="textarea"
                                                                disabled={showOnly}
                                                                onChange={setInstructions}
                                                                value={instructions}
                                                                style={{ width: "100%" }}
                                                                rows={3}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="show-grid">
                                                    <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                                                        <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                            <MyInput
                                                                disabled={showOnly}
                                                                required
                                                                width={"100%"}
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
                                                        </div>
                                                        <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>

                                                            <MyInput
                                                                disabled={showOnly}
                                                                width={"100%"}
                                                                vr={validationResult}
                                                                column
                                                                fieldName="externalPhysician"
                                                                record={appointment}
                                                                setRecord={setAppoitment}
                                                            />
                                                        </div>
                                                        <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                            <MyInput
                                                                disabled={showOnly}
                                                                required
                                                                width={"100%"}
                                                                vr={validationResult}
                                                                column
                                                                fieldLabel="Procedure Level"
                                                                fieldType="select"
                                                                fieldName="procedureLevelLkey"
                                                                selectData={procedureLevelQueryResponse?.object ?? []}
                                                                selectDataLabel="lovDisplayVale"
                                                                selectDataValue="key"
                                                                record={appointment}
                                                                setRecord={setAppoitment}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>



                                                <div className="show-grid">
                                                    <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                                                        <div style={{ flex: 9, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                            <MyInput
                                                                disabled={showOnly}
                                                                required
                                                                width={"100%"}
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
                                                        </div>
                                                        <div style={{ flex: 1, height: "35px", display: "flex", width: "100%", marginTop: "30px", backgroundColor: "#F5F7FB" }}>
                                                            <IconButton
                                                                disabled={(!localPatient?.key) || showOnly}
                                                                onClick={() => setAttachmentsModalOpen(true)}
                                                                style={{ width: "100%", height: "30px" }}
                                                                color="cyan"
                                                                appearance="primary"
                                                                icon={<FileUploadIcon />}
                                                            >
                                                                Attach File
                                                            </IconButton>
                                                        </div>

                                                        <AttachmentModal
                                                            isOpen={attachmentsModalOpen}
                                                            setIsOpen={setAttachmentsModalOpen}
                                                            attachmentSource={localPatient}
                                                            attatchmentType={'APPOINTMENT_ATTACHMENT'}
                                                        />
                                                    </div>
                                                </div>


                                            </>


                                            <div className="show-grid">
                                                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                                                    <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <MyInput
                                                            disabled={showOnly}
                                                            width={"100%"}
                                                            column
                                                            fieldLabel="Consent Form"
                                                            fieldType="checkbox"
                                                            fieldName="consentForm"
                                                            record={appointment}
                                                            setRecord={setAppoitment}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <MyInput
                                                            disabled={showOnly}
                                                            width={165}
                                                            column
                                                            fieldLabel="Reminder"
                                                            fieldType="checkbox"
                                                            fieldName="isReminder"
                                                            record={appointment}
                                                            setRecord={setAppoitment}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                        <MyInput
                                                            disabled={!appointment?.isReminder}
                                                            required
                                                            width={170}
                                                            vr={validationResult}
                                                            column
                                                            fieldLabel="Reminder Type"
                                                            fieldType="select"
                                                            fieldName="reminderLkey"
                                                            selectData={reminderTypeLovQueryResponse?.object ?? []}
                                                            selectDataLabel="lovDisplayVale"
                                                            selectDataValue="key"
                                                            record={appointment}
                                                            setRecord={setAppoitment}

                                                        />
                                                    </div>
                                                </div>
                                            </div>


                                            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                                                <div style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 2 }}>
                                                    <MyInput
                                                        disabled={showOnly}
                                                        vr={validationResult}
                                                        fieldType='textarea'
                                                        column
                                                        fieldName="Notes"
                                                        width={"100%"}
                                                        height={81}
                                                        record={appointment}
                                                        setRecord={setAppoitment}
                                                    />
                                                </div>
                                            </div>



                                        </Form>


                                    </Panel>
                                </div>
                            </div>

                        </div>
                    </div>


                </Modal.Body>
                <Modal.Footer>

                    <IconButton disabled={showOnly} onClick={() => { console.log(selectedEvent || selectedSlot), console.log(appointment), handleSaveAppointment() }} color="violet" appearance="primary" icon={<CheckIcon />}>
                        Save
                    </IconButton>
                    <IconButton disabled={showOnly} color="orange" onClick={handleClear} appearance="primary" icon={<TrashIcon />}>
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