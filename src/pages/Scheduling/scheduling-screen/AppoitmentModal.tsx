import MyInput from "@/components/MyInput";
import Translate from "@/components/Translate";
import QuickPatient from "@/pages/patient/facility-patient-list/QuickPatient";
import { ApAppointment, ApAttachment, ApPatient } from "@/types/model-types";
import { newApAppointment, newApPatient } from "@/types/model-types-constructor";
import { faBan, faBolt, faBroom, faFile, faListCheck, faPlus, faUpload, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { Avatar, Button, ButtonToolbar, Col, DatePicker, Divider, Drawer, FlexboxGrid, Form, Grid, IconButton, Input, InputGroup, Modal, Pagination, Panel, Placeholder, Row, SelectPicker, Stack, Table } from "rsuite";
import InfoRoundIcon from '@rsuite/icons/InfoRound';
import FileUploadIcon from '@rsuite/icons/FileUpload';
import DocPassIcon from '@rsuite/icons/DocPass';
import BlockIcon from '@rsuite/icons/Block';
import CheckIcon from '@rsuite/icons/Check';
import SearchIcon from '@rsuite/icons/Search';
import { initialListRequest, ListRequest } from "@/types/types";
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, fromCamelCaseToDBName } from "@/utils";
import { useGetPatientsQuery } from "@/services/patientService";
import { useGetFacilitiesQuery, useGetLovValuesByCodeQuery } from "@/services/setupService";
import TrashIcon from '@rsuite/icons/Trash';
import { useAppDispatch, useAppSelector } from "@/hooks";
import { useChangeAppointmentStatusMutation, useGetResourcesAvailabilityQuery, useGetResourcesQuery, useGetResourceWithDetailsQuery, useSaveAppointmentMutation } from "@/services/appointmentService";
import AttachmentModal from "@/components/AttachmentUploadModal/AttachmentUploadModal";
import { object } from "prop-types";
import { setPatient } from "@/reducers/patientSlice";
import { notify } from "@/utils/uiReducerActions";
import MyCard from "@/components/MyCard";
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import AdvancedModal from "@/components/AdvancedModal";
import MyButton from "@/components/MyButton/MyButton";
import { green } from "@mui/material/colors";
import "./AppoitmentModal.less";
import { useFetchAttachmentQuery } from "@/services/attachmentService";
import SliceBox from "./SliceBox";

// TODO: we have to use css clases insted of inline styles for better maintainability and performance.

const AppointmentModal = ({ isOpen, onClose, resourceType, facility, onSave, appointmentData, showOnly, from, selectedSlot }) => {

    const { data: resourceAvailabilityDetails, error, isLoading } = useGetResourceWithDetailsQuery(selectedSlot?.resourceId || '', {
        skip: !selectedSlot?.resourceId
    });
    const [selectedSlices, setSelectedSlices] = useState([]);

    useEffect(() => {
        console.log("Selected Slices:", selectedSlices);
    }, [selectedSlices]);

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
        console.log(selectedSlot?.resourceId)
    }, [selectedSlot])

    useEffect(() => {
        console.log(resourceAvailabilityDetails?.object[0]?.availabilitySlices)
    }, [resourceAvailabilityDetails])

// TODO: will user the day constants to map the days of the week instead of using numbers here directly ,/src/constants/days.ts.
    const DAYS = [
        { label: 'Sunday', value: '0' },
        { label: 'Monday', value: '1' },
        { label: 'Tuesday', value: '2' },
        { label: 'Wednesday', value: '3' },
        { label: 'Thursday', value: '4' },
        { label: 'Friday', value: '5' },
        { label: 'Saturday', value: '6' },
    ];
    const minutesToDisplayDate = (minutes) => {
        if (minutes === null || typeof minutes === 'undefined') return null;
        const d = new Date(0);
        d.setHours(Math.floor(minutes / 60));
        d.setMinutes(minutes % 60);
        d.setSeconds(0);
        d.setMilliseconds(0);
        return d;
    };
    const [dailySlices, setDailySlices] = useState({});

    useEffect(() => {
        console.log('useEffect triggered for resourceAvailabilityDetails:', resourceAvailabilityDetails);
        console.log(resourceAvailabilityDetails?.object[0]?.availabilitySlices?.length > 0 ? 'Data found' : 'No data found');
        if (resourceAvailabilityDetails?.object[0]?.availabilitySlices?.length > 0) {
            console.log('Availability slices data found:', resourceAvailabilityDetails.object[0].availabilitySlices);
            const loadedSlices = {};
            resourceAvailabilityDetails.object[0].availabilitySlices.forEach(slice => {
                const day = slice.dayOfWeek;
                if (!loadedSlices[day]) {
                    loadedSlices[day] = [];
                }
                const fromDate = minutesToDisplayDate(slice.startHour);
                const toDate = minutesToDisplayDate(slice.endHour);

                // Log the conversion results
                console.log(`Processing slice for day ${day}: startHour=${slice.startHour} -> fromDate=${fromDate?.toLocaleTimeString()}; endHour=${slice.endHour} -> toDate=${toDate?.toLocaleTimeString()}`);

                loadedSlices[day].push({
                    from: fromDate,
                    to: toDate,
                    isBreak: slice.break || false,
                    SliceKey: slice.key,
                });
            });

            // Sort slices for each day by start time
            Object.keys(loadedSlices).forEach(day => {
                loadedSlices[day].sort((a, b) => {
                    // Ensure 'from' is a valid Date object before comparing
                    const timeA = a.from instanceof Date && !isNaN(a.from) ? a.from.getTime() : 0;
                    const timeB = b.from instanceof Date && !isNaN(b.from) ? b.from.getTime() : 0;
                    return timeA - timeB;
                });
            });

            console.log('Processed dailySlices:', loadedSlices);
            setDailySlices(loadedSlices);
        } else {
            console.log('No availability slices data found or array is empty.');
            setDailySlices({}); // Clear slices if no data
        }
    }, [resourceAvailabilityDetails]);

    // Get unique sorted days that have slices
    const sortedDaysWithSlices = Object.keys(dailySlices).sort((a, b) => parseInt(a) - parseInt(b));



    const patientSlice = useAppSelector(state => state.patient);

    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);

    const [quickPatientModalOpen, setQuickPatientModalOpen] = useState(false);
    const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
    const [appointment, setAppoitment] = useState<ApAppointment>({ ...newApAppointment })
    const [resourcesListRequest, setResourcesListRequest] = useState<ListRequest>({ ...initialListRequest, pageSize: 100 });
    const dispatch = useAppDispatch();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null); // To store selected event details
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
    const [patientImage, setPatientImage] = useState<ApAttachment>(undefined);


    const fetchPatientImageResponse = useFetchAttachmentQuery(
        {
            type: 'PATIENT_PROFILE_PICTURE',
            refKey: localPatient?.key,
        },
        { skip: !localPatient?.key }
    );

    useEffect(() => {
        if (
            fetchPatientImageResponse.isSuccess &&
            fetchPatientImageResponse.data &&
            fetchPatientImageResponse.data.key
        ) {
            setPatientImage(fetchPatientImageResponse.data);
        } else {
            setPatientImage(undefined);
        }
    }, [fetchPatientImageResponse]);

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
    const [isSideSearchOpen, setIsSideSearchOpen] = useState(false);

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
        setModalKey(prev => prev + 1);
        setLocalPatient(newApPatient)
        setAppoitment(newApAppointment)
        setPatientAge(null)
        setValidationResult(undefined);
        setReRenderModal(!reRenderModal)
        setInstructions(null)
        setInstructionsKey(null)
        setInstructionsValue(null)
        setSelectedCriterion(null)
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
        setIsSideSearchOpen(true);
        setPatientSearchTarget(target);
        // setSearchResultVisible(true);
        console.log(selectedCriterion)

        if (searchKeyword && searchKeyword.length >= 3 && selectedCriterion) {
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
            <div style={{ width: "100%" }}>
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
                        <div style={{ flex: 1 }} className="input-wrapper" >
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
                                    <InputGroup.Button
                                        style={{ marginTop: "1px" }}
                                        disabled={!selectedCriterion}
                                        onClick={() => search(target)}>
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
                        // dispatch(notify({ msg: 'The patient already has an appointment on this day.', sev: 'warn' }));

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
            const startTime = period.startTime;
            const endTime = period.endTi
            const periodStartHour = Math.floor(startTime / 3600)
            const periodStartMinute = Math.floor((startTime % 3600) / 60);
            const periodEndHour = Math.floor(endTime / 3600);
            const periodEndMinute = Math.floor((endTime % 3600) / 60);
            const selectedTimeInSeconds = hour * 3600 + minute * 60;
            if (selectedTimeInSeconds >= startTime && selectedTimeInSeconds < endTime) {
                isAvailable = false;
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
        const today = new Date();
        const currentDay = today.getDate();

        const futureDates = availableDatesInMonth?.filter(date => date >= currentDay);
        setFilteredDates(futureDates);
    }, [availableDatesInMonth]);


    useEffect(() => {
        console.log(patientListResponse?.object)
    }, [patientListResponse])


    const [modalKey, setModalKey] = useState(0);


    const handleDayClick = (day) => {
        setOpenDay(openDay === day ? null : day);
    };
    const [openDay, setOpenDay] = useState(null);


    return (
        <div>
            <AdvancedModal
                leftWidth={"25%"}
                rightWidth={"75%"}
                key={modalKey}
                isLeftClosed={!isSideSearchOpen}
                defaultClose={true}
                size="90vw"
                height="85vh"
                open={isOpen}
                setOpen={() => { onClose(), handleClear() }}
                actionButtonFunction={
                    handleSaveAppointment
                }
                footerButtons={
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <MyButton
                            appearance="ghost"
                            prefixIcon={() => <FontAwesomeIcon icon={faBan} />}
                            onClick={handleClear}
                        >Clear</MyButton>
                    </div>}
                rightTitle='Add Appointment'
                rightContent={
                    <div className="appointment-wrapper">
                        <div className="appointment-content-wrapper">
                            <div className="left-input">
                                {from === 'Schedule' &&
                                    <Panel>
                                        <div className="show-grid">
                                            <div className="flex-container" >
                                                <div style={{ flex: 5, padding: 2 }}>
                                                    {conjurePatientSearchBar('primary')}
                                                </div>
                                                <div className="input-wrapper" style={{ flex: 1 }}>
                                                    <div style={{ flexShrink: 0, marginTop: "22px" }}>
                                                        <Button
                                                            appearance="ghost"
                                                            className="quick-patient-button"
                                                            onClick={() => setQuickPatientModalOpen(true)}
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={faBolt}
                                                                className="quick-patient-icon"
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
                                <Panel

                                    header={
                                        <p style={{ fontSize: '12px', color: '#A1A9B8', fontWeight: 600 }}>
                                            <Translate>Patient Information</Translate>
                                        </p>}>
                                    <Panel bordered>
                                        <div className="flex-container"  >

                                            <div className="input-wrapper" style={{ flex: 2, display: "flex", alignItems: "center" }}>
                                                <div>
                                                    <Avatar size="xl" circle src={
                                                        patientImage && patientImage.fileContent
                                                            ? `data:${patientImage.contentType};base64,${patientImage.fileContent}`
                                                            : 'https://img.icons8.com/?size=150&id=ZeDjAHMOU7kw&format=png'
                                                    } />
                                                </div>

                                                <div style={{ marginLeft: "8px" }}>
                                                    <p style={{ fontSize: '15px' }}>
                                                        {localPatient?.fullName}
                                                    </p>
                                                    <p style={{ fontSize: '12px', color: '#A1A9B8', fontWeight: 600 }}>
                                                        {/* {localPatient?.genderLkey} */}
                                                        <FontAwesomeIcon icon={faUser} />{`${localPatient?.genderLvalue?.lovDisplayVale || 'N/A'}${patientAge?.patientAge ? `, ${patientAge.patientAge}y old` : ''}`}


                                                    </p>

                                                    <p style={{ fontSize: '12px', color: '#A1A9B8' }}>
                                                        {localPatient?.patientMrn ? `#${localPatient.patientMrn}` : ''}
                                                    </p>
                                                </div>

                                            </div>


                                            <div style={{ flex: 4, display: "flex", alignItems: "center", gap: "10px", padding: 2 }}>
                                                <Divider style={{ height: "50px" }} vertical />
                                                <div className="input-wrapper" style={{ flex: 1 }}>
                                                    <p style={{ fontSize: '10px', color: '#A1A9B8' }}>
                                                        Document Type
                                                    </p>
                                                    {localPatient?.documentTypeLvalue?.lovDisplayVale || '-'}

                                                </div>
                                                <div className="input-wrapper" style={{ flex: 1 }}>

                                                    <div className="input-wrapper" style={{ flex: 1 }}>
                                                        <p style={{ fontSize: '10px', color: '#A1A9B8' }}>
                                                            Document No
                                                        </p>
                                                        {localPatient?.documentNo || "-"}
                                                    </div>

                                                </div>
                                                <div className="input-wrapper" style={{ flex: 1 }}>
                                                    <div className="input-wrapper" style={{ flex: 1 }}>
                                                        <p style={{ fontSize: '10px', color: '#A1A9B8' }}>
                                                            Mobile Number
                                                        </p>
                                                        {localPatient?.mobileNumber || '-'}
                                                    </div>

                                                </div>
                                                <div className="input-wrapper" style={{ flex: 1 }}>
                                                    <div className="input-wrapper" style={{ flex: 1 }}>
                                                        <p style={{ fontSize: '10px', color: '#A1A9B8' }}>
                                                            Email
                                                        </p>
                                                        {localPatient?.email || '-'}
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                    </Panel>

                                </Panel>
                                <Panel
                                    header={
                                        <p style={{ fontSize: '12px', color: '#A1A9B8', fontWeight: 600 }}>
                                            <Translate>Visit Details</Translate>
                                        </p>
                                    } >
                                    <Form layout="inline" fluid>
                                        <div className="show-grid">
                                            <div className="flex-container">
                                                <div className="input-wrapper" style={{ flex: 2 }}>
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
                                                <div className="input-wrapper" style={{ flex: 4 }}>
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
                                            <div className="flex-container">
                                                <div className="input-wrapper" style={{ flex: 2 }}>
                                                    <MyInput
                                                        height={35}
                                                        disabled={showOnly}

                                                        width={"100%"}
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
                                                <div className="input-wrapper" style={{ flex: 4 }}>
                                                    <MyInput
                                                        height={35}
                                                        disabled={showOnly}
                                                        width={"100%"}
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
                                            <div className="flex-container">
                                                <div className="input-wrapper" style={{ flex: 1 }}>
                                                    <MyInput
                                                        height={35}

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
                                                <div className="input-wrapper" style={{ flex: 2 }}>
                                                    <div style={{ display: "flex", gap: "10px" }}>
                                                        <div style={{ flex: 1 }}>
                                                            <MyInput
                                                                height={35}

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
                                                        <div style={{ flex: 1, display: "flex", alignItems: "end" }}>
                                                            <Button
                                                                disabled={showOnly}

                                                                onClick={() => setAttachmentsModalOpen(true)}
                                                                appearance="primary"
                                                                className="icon-button-primary"
                                                                style={{ width: "100%" }}
                                                            >
                                                                <FontAwesomeIcon className="icon-button-primary-icon" icon={faListCheck} />
                                                                <Translate>Add New Appointments</Translate>
                                                            </Button>
                                                        </div>

                                                    </div>
                                                </div>

                                            </div>
                                        </div>

                                    </Form>
                                </Panel>
                            </div>
                            <div className="right-input">
                                <Panel

                                    header={
                                        <p style={{ fontSize: '12px', color: '#A1A9B8', fontWeight: 600 }}>
                                            <Translate>Schedule Appointment</Translate>
                                        </p>
                                    } >
                                    <Form layout="inline" fluid>
                                        <div className="show-grid">
                                            <div className="flex-container">
                                                <div className="input-wrapper" style={{ flex: 1 }}>
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
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="input-wrapper" style={{ flex: 1 }}>
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
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="input-wrapper" style={{ flex: 1 }}>
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
                                            <div className="flex-container">
                                                <div className="input-wrapper" style={{ flex: 1 }}>
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
                                                <div className="input-wrapper" style={{ flex: 1 }}>
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

                                <div style={{ width: "100%" }}>

                                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                                        {sortedDaysWithSlices.map((day) => {
                                            const dayLabel = DAYS.find(d => d.value === day)?.label;

                                            return (
                                                <div
                                                    key={day}
                                                    onClick={() => handleDayClick(day)}
                                                    style={{
                                                        padding: "8px 12px",
                                                        borderRadius: "8px",
                                                        cursor: "pointer",
                                                        backgroundColor: openDay === day ? "#4caf50" : "#f0f0f0",
                                                        color: openDay === day ? "white" : "black",
                                                        fontWeight: "bold",
                                                        userSelect: "none",
                                                        transition: "background-color 0.3s",
                                                    }}
                                                >
                                                    {dayLabel}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <SliceBox
                                        dailySlices={dailySlices}
                                        openDay={openDay}
                                        // sortedDaysWithSlices={sortedDaysWithSlices}
                                        onSelectionChange={(newSelection) => {
                                            setSelectedSlices(newSelection);
                                            // setAppoitment({
                                            //     ...appointment,
                                            //     appointmentSlices: newSelection.map(sliceId => {
                                            //         const [day, index] = sliceId.split('-').map(Number);
                                            //         return dailySlices[day][index];
                                            //     })
                                            // });
                                        }}
                                    />

                                </div>
                                <Panel
                                    header={
                                        <p style={{ fontSize: '12px', color: '#A1A9B8', fontWeight: 600 }}>
                                            <Translate>Additional Information</Translate>
                                        </p>
                                    } >

                                    <Form layout="inline" fluid>

                                        <div className="show-grid">
                                            <div className="flex-container">
                                                <div className="input-wrapper" style={{ flex: 1 }}>
                                                    <MyInput
                                                        disabled={showOnly}

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
                                                <div className="input-wrapper" style={{ flex: 1 }}>
                                                    <Input
                                                        as="textarea"
                                                        disabled={showOnly}
                                                        onChange={setInstructions}
                                                        value={instructions}
                                                        style={{ width: "100%", height: "50px" }}
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="show-grid">
                                            <div className="flex-container">
                                                <div className="input-wrapper" style={{ flex: 1 }}>
                                                    <MyInput
                                                        disabled={showOnly}

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
                                                <div className="input-wrapper" style={{ flex: 1 }}>

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
                                                <div className="input-wrapper" style={{ flex: 1 }}>
                                                    <MyInput
                                                        disabled={showOnly}

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
                                            <div className="flex-container">
                                                <div className="input-wrapper" style={{ flex: 9 }}>
                                                    <MyInput
                                                        disabled={showOnly}

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
                                                <Button
                                                    onClick={() => setAttachmentsModalOpen(true)}
                                                    appearance="primary"
                                                    className="icon-button-primary"
                                                    disabled={(!localPatient?.key) || showOnly}>
                                                    <FontAwesomeIcon className="icon-button-primary-icon"
                                                        icon={faUpload}
                                                    />
                                                    <Translate>Attach File</Translate>
                                                </Button>

                                                <AttachmentModal
                                                    isOpen={attachmentsModalOpen}
                                                    setIsOpen={setAttachmentsModalOpen}
                                                    attachmentSource={localPatient}
                                                    attatchmentType={'APPOINTMENT_ATTACHMENT'}
                                                    patientKey={localPatient?.key}
                                                />
                                            </div>
                                        </div>


                                        <div className="show-grid">
                                            <div className="flex-container">
                                                <div className="input-wrapper"  >
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
                                                <div className="input-wrapper"  >
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
                                                <div className="input-wrapper"  >
                                                    <MyInput
                                                        disabled={!appointment?.isReminder}

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


                                        <div className="flex-container">
                                            <div className="input-wrapper" style={{ flex: 1 }}>
                                                <MyInput
                                                    disabled={showOnly}
                                                    vr={validationResult}
                                                    fieldType='textarea'
                                                    column
                                                    fieldName="Notes"
                                                    width={"100%"}
                                                    height={70}
                                                    record={appointment}
                                                    setRecord={setAppoitment}
                                                />
                                            </div>
                                        </div>
                                    </Form>
                                </Panel>
                            </div>
                        </div>

                    </div>}

                leftContent={
                    <div className="appointment-wrapper-left" style={{ marginBottom: "20px" }}>
                        <div className="show-grid" >
                            <div className="flex-container" style={{ justifyContent: "space-between" }}   >
                                <p className="left-side-title" >Patients List</p>
                                <IconButton
                                    onClick={() => setIsSideSearchOpen(false)}
                                    circle
                                    icon={<FontAwesomeIcon icon={faUser} />}
                                    appearance="ghost" />
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: "100%",
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
                                                setSearchKeyword('');
                                                setIsSideSearchOpen(false);
                                                setSelectedCriterion(null)
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
                    </div>
                }
            >

            </AdvancedModal>




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