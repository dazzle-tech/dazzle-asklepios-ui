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
import { useChangeAppointmentStatusMutation, useGetResourcesAvailabilityQuery, useGetResourcesQuery, useSaveAppointmentMutation } from "@/services/appointmentService";
import AttachmentModal from "@/pages/patient/patient-profile/AttachmentUploadModal";
import { object } from "prop-types";



const AppointmentModal = ({ isOpen, onClose, startAppoitmentStart, resourceType, facility, onSave }) => {

    const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);

    const [quickPatientModalOpen, setQuickPatientModalOpen] = useState(false);
    const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
    const [appointment, setAppoitment] = useState<ApAppointment>({ ...newApAppointment })
    const [resourcesListRequest, setResourcesListRequest] = useState<ListRequest>({ ...initialListRequest });

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

    const { data: resourcesAvailability } = useGetResourcesAvailabilityQuery({
        resource_key: appointment.resourceKey,
        facility_id: "",
    });

    useEffect(() => {
        setRowPeriods(resourcesAvailability?.object)
        console.log(resourcesAvailability?.object)
        console.log(appointment.resourceKey)
        filterWeekDays()
    }, [resourcesAvailability, appointment.resourceKey])


    const dayOptions = availablePeriods.map((item) => ({
        label: item.day,
        value: item.day,
    }));
    const { data: resourcesListResponse } = useGetResourcesQuery(resourcesListRequest);

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
    };

    const handleClear = () => {
        setLocalPatient(newApPatient)
        setAppoitment(newApAppointment)
        setPatientAge(null)
        setValidationResult(undefined);
        setReRenderModal(!reRenderModal)
        setSelectedStartDate(null)
        setInstructions(null)
        setInstructionsKey(null)
        setInstructionsValue(null)
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
        setAppoitment({ ...appointment, reminderLkey: null })
    }, [appointment?.isReminder])

    useEffect(() => {
        console.log(resourceTypeQueryResponse)
    }, [resourceTypeQueryResponse])

    useEffect(() => {
        setAppoitment({ ...appointment, patientKey: localPatient.key })
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
                prevInstructions ? `${prevInstructions}, ${instructionValue}` : instructionValue
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

        console.log({ ...appointment, appointmentStart: calculateAppointmentDate(0), appointmentEnd: calculateAppointmentDate(selectedDuration), instructions: instructions })
        saveAppointment({ ...appointment, appointmentStart: calculateAppointmentDate(0), appointmentEnd: calculateAppointmentDate(selectedDuration), instructions: instructions }).unwrap().then(() => {
            closeModal()
            handleClear()
            onSave()
        })
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



    const filterWeekDays = () => {
        const result = {};

        rowPeriods?.forEach((item) => {
            const resourceKey = item.resourceKey;
            const day = item.dayLvalue.lovDisplayVale;
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

        setAvailabilDays(availabilityPickerData);
    };




    useEffect(() => {
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
                        disabled
                            width={150}
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
                            width={300}
                            column
                            fieldLabel="Resources"
                            selectData={resourcesListResponse?.object ?? []}
                            fieldType="select"
                            selectDataLabel="resourceName"
                            selectDataValue="key"
                            fieldName="resourceKey"
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
                        <MyInput
                            required
                            width={165}
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
                        />



                        <div style={{ display: "flex", width: "100%", justifyContent: "flex-end", marginTop: "30px" }}>
                            <IconButton
                                disabled={!localPatient?.key}
                                color="cyan"
                                style={{ marginRight: "80px", width: 170 }}
                                appearance="primary"
                                icon={<DocPassIcon />}
                            >
                                Add To Waiting List
                            </IconButton>
                        </div>
                    </Form>
                    <br />
                    <br />

                    <Panel
                        bordered
                        header={
                            <h5 className="title">
                                <Translate>Schedule Appointment</Translate>
                            </h5>
                        }>
                        <Form layout="inline" style={{ display: "flex" }} fluid>
                            <div style={{ display: "flex", justifyItems: "left", gap: 10 }}>
                                {/* Select Year */}
                                <div>
                                    <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                        Month
                                    </label>
                                    <SelectPicker
                                        style={{ width: 120 }}
                                        data={Array.from({ length: 5 }, (_, index) => {
                                            const year = new Date().getFullYear() + index; // السنوات الحالية + الأربع سنوات القادمة
                                            return { label: year.toString(), value: year };
                                        })}
                                        defaultValue={new Date().getFullYear()} // تعيين السنة الحالية كقيمة افتراضية
                                        onChange={(selectedYear) => {
                                            setSelectedYear(selectedYear);
                                            updateAvailableDates(selectedYear, selectedMonth); // تحديث الأيام المتاحة
                                        }}
                                    />
                                </div>

                                {/* Select Month */}
                                <div>
                                    <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                        Month
                                    </label>
                                    <SelectPicker
                                        style={{ width: 120 }}
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
                                        defaultValue={new Date().getMonth()} // Default to current month (0-based index)
                                        onChange={(selectedMonth) => {
                                            setSelectedMonth(selectedMonth);
                                            updateAvailableDates(selectedYear, selectedMonth); // Update available dates
                                        }}
                                    />
                                </div>
                                {/* Seelct Week Day*/}
                                <div>
                                    <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                        Week Day
                                    </label>
                                    <SelectPicker
                                        style={{ width: 250 }}
                                        data={availabilDays ? availabilDays.map(item => ({ label: item.label, value: item.value })) : []}
                                        onChange={handleSelectDayOfWeek}
                                    />
                                </div>
                                {/* Select Month Day */}
                                <div>
                                    <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                        Month Day
                                    </label>
                                    <SelectPicker
                                        style={{ width: 120 }}
                                        disabled={!(availableDatesInMonth && availableDatesInMonth.length > 0)}
                                        data={availableDatesInMonth ? availableDatesInMonth.map(date => ({ label: `Day ${date}`, value: date })) : []}
                                        onChange={(selectedMonthDay) => setSelectedMonthDay(selectedMonthDay)}
                                    />
                                </div>

                                {/* Select Time */}
                                <div>
                                    <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                        Time
                                    </label>
                                    <div>
                                        <DatePicker
                                            disabled={!selectedMonthDay}
                                            format="HH:mm" // Show hours and minutes only
                                            ranges={[]}
                                            shouldDisableHour={(hour) => !isHourAvailable(hour)} // Disable unavailable hours
                                            shouldDisableMinute={(minute, selectedHour) => !isMinuteAvailable(selectedHour, minute)} // Disable unavailable minutes
                                            onChange={(value) => setSelectedTime(value)}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: 30 }}>
                                    <InfoRoundIcon onClick={() => { filterWeekDays() }} style={{ marginLeft: "5px", fontSize: "22px", color: "blue" }} />

                                </div>
                            </div>
                        </Form>
                    </Panel>



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
                                record={instructionKey}
                                setRecord={setInstructionsKey}
                            />
                            <Input as="textarea" onChange={(e) => setInstructions(e)} value={instructions} style={{ width: 450, marginTop: 20 }} rows={3} />

                        </div>


                        <MyInput
                            vr={validationResult}
                            fieldType='textarea'
                            column
                            fieldName="Notes"
                            width={380}
                            height={125}
                            record={appointment}
                            setRecord={setAppoitment}
                        />

                        <div style={{ display: "flex", flexDirection: 'column' }} >
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
                            <br /><br /><br />
                            <div >
                                <IconButton
                                    disabled={!localPatient?.key}
                                    onClick={() => setAttachmentsModalOpen(true)}
                                    style={{ marginRight: "70px", width: 165, height: "30px" }} color="cyan"
                                    appearance="primary" icon={<FileUploadIcon />}
                                >
                                    Attach File
                                </IconButton>

                                {/* ===================AttachmentModal=================== */}
                                <AttachmentModal isOpen={attachmentsModalOpen} onClose={() => setAttachmentsModalOpen(false)} localPatient={localPatient} attatchmentType={'APPOINTMENT_ATTACHMENT'} />

                            </div>
                        </div>


                        <MyInput
                            width={165}
                            column
                            fieldLabel="consent Form"
                            fieldType="checkbox"
                            fieldName="consentForm"
                            record={appointment}
                            setRecord={setAppoitment}
                        />

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
                        {/* <div style={{ display: "flex", width: "20%", justifyContent: "flex-end", marginTop: "30px" }}>


                        </div> */}



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
                            fieldLabel="Procedure Level"
                            fieldType="select"
                            fieldName="procedureLevelLkey"
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
                    <IconButton onClick={() => { console.log(selectedEvent || selectedSlot), console.log(appointment), handleSaveAppointment() }} color="violet" appearance="primary" icon={<CheckIcon />}>
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