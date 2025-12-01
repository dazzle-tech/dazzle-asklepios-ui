import MyInput from '@/components/MyInput';
import { useSaveAvailabilitySlicesMutation, useGetResourcesWithAvailabilityQuery } from '@/services/appointmentService';
import { initialListRequest } from '@/types/types';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    Button,
    Form,
    SelectPicker,
    CheckboxGroup,
    Checkbox,
    TimePicker,
    Panel
} from 'rsuite';
import { DAYS, DayValue } from '@/constants/days';
import { ApResources } from '@/types/model-types';
import { useGetFacilitiesQuery } from '@/services/setupService';


const SLICE_DURATION_MINUTES = 30;

const NewAvailabilityTimeModal = ({ open, setOpen, selectedResource }) => {
    const [facility, setFacility] = useState(null);
    const [resource, setResource] = useState<ApResources>(selectedResource || null);
    const [fromTime, setFromTime] = useState(null);
    const [toTime, setToTime] = useState(null);
    const [timeSlices, setTimeSlices] = useState({});
    const [sliceDuration, setSliceDuration] = useState(SLICE_DURATION_MINUTES);
    const [selectedDays, setSelectedDays] = useState<DayValue[]>(
        selectedResource?.object?.[0]?.availabilitySlices
            ? Array.from(
                new Set(
                    selectedResource.object[0].availabilitySlices.map(
                        (slice) => String(slice.dayOfWeek) as DayValue
                    )
                )
            )
            : []
    );
    const [saveResourcesAvailabilitySlices] = useSaveAvailabilitySlicesMutation();

    useEffect(() => { console.log(selectedDays) }, [selectedDays]);

    const resourceKey = selectedResource?.object?.[0]?.key;

    const {
        data: facilityListResponse,
        isLoading: isGettingFacilities,
        isFetching: isFetchingFacilities
    } = useGetFacilitiesQuery({ ...initialListRequest });

    // Fetch saved availability data when modal opens
    const { data: resourcesWithAvailabilityResponse, refetch: refetchAvailability } = useGetResourcesWithAvailabilityQuery(
        {
            ...initialListRequest,
            filters: resourceKey ? [{ fieldName: 'resource_key', operator: 'match', value: resourceKey }] : []
        },
        { skip: !resourceKey || !open }
    );

    // Fetch availability data when modal opens
    useEffect(() => {
        if (open && resourceKey) {
            refetchAvailability();
        }
    }, [open, resourceKey, refetchAvailability]);

    // Load data from API response
    useEffect(() => {
        if (resourcesWithAvailabilityResponse?.object?.length > 0) {
            const loadedSlices: Record<string, any[]> = {};
            const loadedDays: DayValue[] = [];
            let loadedFacility = null;
            let loadedFromTime = null;
            let loadedToTime = null;

            resourcesWithAvailabilityResponse.object.forEach(objItem => {
                // Set facility from first item that matches resource key
                if (!loadedFacility && objItem.facilityKey && objItem.key === resourceKey) {
                    loadedFacility = { facilityKey: objItem.facilityKey };
                }

                if (objItem.key === resourceKey && objItem.availabilitySlices?.length > 0) {
                    objItem.availabilitySlices.forEach(slice => {
                        const day = String(slice.dayOfWeek);
                        
                        if (!['0', '1', '2', '3', '4', '5', '6'].includes(day)) {
                            return;
                        }

                        if (!loadedSlices[day]) {
                            loadedSlices[day] = [];
                            loadedDays.push(day as DayValue);
                        }

                        const fromDate = minutesToDisplayDate(slice.startHour);
                        const toDate = minutesToDisplayDate(slice.endHour);

                        // Set fromTime and toTime from first slice if not set
                        if (!loadedFromTime && fromDate) {
                            loadedFromTime = fromDate;
                        }
                        if (!loadedToTime && toDate) {
                            loadedToTime = toDate;
                        }

                        loadedSlices[day].push({
                            from: fromDate,
                            to: toDate,
                            isBreak: slice.break || false
                        });
                    });
                }
            });

            // Set facility if found
            if (loadedFacility) {
                setFacility(loadedFacility);
            }

            // Set time range if found
            if (loadedFromTime && loadedToTime) {
                setFromTime(loadedFromTime);
                setToTime(loadedToTime);
            }

            // Set slices and days
            if (loadedDays.length > 0) {
                setTimeSlices(loadedSlices);
                setSelectedDays(loadedDays);
            }
        }
    }, [resourcesWithAvailabilityResponse, resourceKey]);

    const generateSlices = (from, to, duration) => {
        console.log('generateSlices - Raw From:', from);
        console.log('generateSlices - Raw To:', to);

        const start = (from instanceof Date && !isNaN(from.getTime())) ? from : new Date();
        const end = (to instanceof Date && !isNaN(to.getTime())) ? to : new Date();

        if (isNaN(start.getTime())) {
            console.warn("Invalid 'from' date provided to generateSlices. Defaulting to 9 AM (fallback).");
            start.setHours(9, 0, 0, 0);
        }
        if (isNaN(end.getTime())) {
            console.warn("Invalid 'to' date provided to generateSlices. Defaulting to 5 PM (fallback).");
            end.setHours(17, 0, 0, 0);
        }

        const slices = [];
        const referenceDate = new Date('2000-01-01T00:00:00');

        let currentSliceStart = new Date(referenceDate);
        currentSliceStart.setHours(start.getHours(), start.getMinutes(), 0, 0);

        let endOfInterval = new Date(referenceDate);
        endOfInterval.setHours(end.getHours(), end.getMinutes(), 0, 0);

        if (endOfInterval.getTime() < currentSliceStart.getTime()) {
            endOfInterval.setDate(endOfInterval.getDate() + 1);
        }

        while (currentSliceStart.getTime() < endOfInterval.getTime()) {
            const nextSliceEnd = new Date(currentSliceStart.getTime() + duration * 60000);

            if (nextSliceEnd.getTime() > endOfInterval.getTime()) {
                break;
            }

            slices.push({
                // This function internally creates and returns numbers (minutes from midnight)
                // It's crucial that this function returns NUMBERS, not Dates
                startTimeMinutes: currentSliceStart.getHours() * 60 + currentSliceStart.getMinutes(),
                endTimeMinutes: nextSliceEnd.getHours() * 60 + nextSliceEnd.getMinutes(),
                isBreak: false
            });
            currentSliceStart.setTime(nextSliceEnd.getTime());
        }

        return slices;
    };


    const handleGenerate = () => {
        if (!fromTime || !toTime || selectedDays.length === 0) return;
        const generated = {};
        // originalSlices will contain objects with startTimeMinutes and endTimeMinutes (numbers)
        const originalSlices = generateSlices(fromTime, toTime, sliceDuration);
        selectedDays.forEach(day => {
            generated[day] = originalSlices.map(slice => ({
                //Convert minutes to Date objects for the state
                from: minutesToDisplayDate(slice.startTimeMinutes),
                to: minutesToDisplayDate(slice.endTimeMinutes),
                isBreak: slice.isBreak || false
            }));
        });
        setTimeSlices(generated);
    };

    const generateMinutesFromMidnight = (dateObject) => {
    if (!(dateObject instanceof Date) || isNaN(dateObject.getTime())) return null;
    return dateObject.getHours() * 60 + dateObject.getMinutes();
    };
    const minutesToDisplayDate = (minutes) => {
        if (minutes === null || typeof minutes === 'undefined') return null;
        const d = new Date(0);
        d.setHours(Math.floor(minutes / 60));
        d.setMinutes(minutes % 60);
        d.setSeconds(0);
        d.setMilliseconds(0);
        return d;
    };

    const handleSave = async () => {
        const finalData = selectedDays.map(day => {
            return {
                day: day,
                slices: timeSlices[day].map(slice => ({
                    startTimeMinutes: generateMinutesFromMidnight(slice.from),
                    endTimeMinutes: generateMinutesFromMidnight(slice.to),
                    isBreak: slice.isBreak || false
                }))
            };
        });

        try {
            await saveResourcesAvailabilitySlices({
                facility: facility?.facilityKey,
                resource: selectedResource?.object[0].key,
                availability: finalData
            }).unwrap();
            console.log('✅ SAVE SUCCESS:', {
                facility,
                resource: selectedResource?.object[0].key,
                availability: finalData
            });
            // Refetch data after save
            if (resourceKey) {
                await refetchAvailability();
            }
        } catch (err) {
            console.error('❌ SAVE ERROR:', err);
        }
    };

    const handleToggleBreak = (day, index) => {
        const updated = { ...timeSlices };
        updated[day][index].isBreak = !updated[day][index].isBreak;
        setTimeSlices(updated);
    };

    const handleDeleteSlice = (day, index) => {
        const updated = { ...timeSlices };
        updated[day] = updated[day].filter((_, i) => i !== index);
        setTimeSlices(updated);
    };

const createTimeRefDate = (dateObj) => {
    const referenceDate = new Date('2000-01-01T00:00:00'); 
    const refTime = new Date(referenceDate);
    if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
        refTime.setHours(dateObj.getHours(), dateObj.getMinutes(), 0, 0);
    } else {
        refTime.setHours(0, 0, 0, 0);
    }
    return refTime;
};

 
const canAddSliceLeft = (day, slices, sliceDuration, fromTime) => {
    let potentialNewFromTime: Date;

    if (slices.length === 0) {
        const baseTime = fromTime ? new Date(fromTime) : new Date();
        baseTime.setHours(9, 0, 0, 0); // Default start if no fromTime
        potentialNewFromTime = new Date(baseTime.getTime() - sliceDuration * 60000);

        const potentialNewFromMinutes = generateMinutesFromMidnight(potentialNewFromTime);
        return potentialNewFromMinutes !== null && potentialNewFromMinutes >= 0; 
    } else {
        const firstSlice = slices[0];
        potentialNewFromTime = new Date(firstSlice.from.getTime() - sliceDuration * 60000);

        if (firstSlice.from.getHours() === 0 && potentialNewFromTime.getHours() === 23) {
            return false; 
        }
        const potentialNewFromTimeRef = createTimeRefDate(potentialNewFromTime);
        const midnightRef = createTimeRefDate(new Date('2000-01-01T00:00:00'));
        return potentialNewFromTimeRef.getTime() >= midnightRef.getTime();
    }
};

const canAddSliceRight = (day, slices, sliceDuration, toTime) => {
    let potentialNewToTime: Date;

    if (slices.length === 0) {
        const baseTime = toTime ? new Date(toTime) : new Date();
        baseTime.setHours(9, 0, 0, 0);
        potentialNewToTime = new Date(baseTime.getTime() + sliceDuration * 60000);

        const potentialNewToMinutes = generateMinutesFromMidnight(potentialNewToTime);
        // We want to allow up to 23:59 that mean 00:00 of the next day is the stop point, i will change it later if bussness need.
        // If current time is 23:30, and sliceDuration is 30, newTo is 00:00 (next day) This should NOT be added.
        return potentialNewToMinutes !== null && potentialNewToMinutes < 24 * 60; // Must be strictly before 00:00
    } else {
        const lastSlice = slices[slices.length - 1];
        potentialNewToTime = new Date(lastSlice.to.getTime() + sliceDuration * 60000);

        if (lastSlice.to.getHours() === 23 && potentialNewToTime.getHours() === 0) {
            return false; // Prevent adding if it wraps to next day,i will handle it with better logic later.
        }

        const potentialNewToTimeRef = createTimeRefDate(potentialNewToTime);
        const endOfDayRef = createTimeRefDate(new Date('2000-01-01T23:59:59'));
        endOfDayRef.setMilliseconds(999);

        return potentialNewToTimeRef.getTime() <= endOfDayRef.getTime();
    }
};

const handleAddSliceLeft = (day) => {
    setTimeSlices(prev => {
        const slices = prev[day] || [];

        if (!canAddSliceLeft(day, slices, sliceDuration, fromTime)) {
            console.log('handleAddSliceLeft: Operation prevented by boundary check.');
            return prev;
        }

        let newFrom: Date;
        let newTo: Date;

        if (slices.length === 0) {
            const baseTime = fromTime ? new Date(fromTime) : new Date();
            baseTime.setHours(9, 0, 0, 0);
            newFrom = new Date(baseTime.getTime() - sliceDuration * 60000);
            newTo = new Date(baseTime);
        } else {
            const firstSlice = slices[0];
            newFrom = new Date(firstSlice.from.getTime() - sliceDuration * 60000);
            newTo = new Date(firstSlice.from);
        }

        const newSlice = { from: newFrom, to: newTo, isBreak: false };
        console.log('New slice added to left:', newSlice);
        return {
            ...prev,
            [day]: [newSlice, ...slices]
        };
    });
};

const handleAddSliceRight = (day) => {
    setTimeSlices(prev => {
        const slices = prev[day] || [];

        if (!canAddSliceRight(day, slices, sliceDuration, toTime)) {
            console.log('handleAddSliceRight: Operation prevented by boundary check.');
            return prev;
        }

        let newFrom: Date;
        let newTo: Date;

        if (slices.length === 0) {
            const baseTime = toTime ? new Date(toTime) : new Date();
            baseTime.setHours(9, 0, 0, 0);
            newFrom = new Date(baseTime);
            newTo = new Date(newFrom.getTime() + sliceDuration * 60000);
        } else {
            const lastSlice = slices[slices.length - 1];
            newFrom = new Date(lastSlice.to);
            newTo = new Date(newFrom.getTime() + sliceDuration * 60000);
        }

        const newSlice = { from: newFrom, to: newTo, isBreak: false };
        console.log('New slice added to right:', newSlice);
        return {
            ...prev,
            [day]: [...slices, newSlice]
        };
    });
};

    const handleCancel = () => {
        setFacility(null);
        setResource(null);
        setFromTime(null);
        setToTime(null);
        setSliceDuration(SLICE_DURATION_MINUTES);
        setSelectedDays([]);
        setTimeSlices({});
        // setOpen(false); 
    };


    // Reset form when modal closes
    useEffect(() => {
        if (!open) {
            setFacility(null);
            setFromTime(null);
            setToTime(null);
            setSliceDuration(SLICE_DURATION_MINUTES);
            setSelectedDays([]);
            setTimeSlices({});
        }
    }, [open]);

    return (
        <Modal open={open} onClose={() => setOpen(false)} size="lg">
            <Modal.Header>
                <Modal.Title>New Availability Time</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form fluid>
                    <div style={{ display: 'flex', gap: '1rem' }}>
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
                            record={facility}
                            setRecord={setFacility}
                        />
                        
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <Form.Group style={{ flex: 1 }}>
                            <Form.ControlLabel>Time Range</Form.ControlLabel>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <TimePicker
                                    placeholder="From"
                                    value={fromTime}
                                    onChange={setFromTime}
                                    style={{ width: '100%' }}
                                    hideMinutes={minute => minute % 30 !== 0}
                                />
                                <TimePicker
                                    placeholder="To"
                                    value={toTime}
                                    onChange={setToTime}
                                    style={{ width: '100%' }}
                                    hideMinutes={minute => minute % 30 !== 0}
                                />
                            </div>
                        </Form.Group>

                        <Form.Group style={{ flex: '0 0 150px' }}>
                            <Form.ControlLabel>Slice Duration</Form.ControlLabel>
                            <SelectPicker
                                data={[
                                    { label: '10 minutes', value: 10 },
                                    { label: '20 minutes', value: 20 },
                                    { label: '30 minutes', value: 30 },
                                    { label: '60 minutes', value: 60 },
                                ]}
                                value={sliceDuration}
                                onChange={setSliceDuration}
                                style={{ width: '100%' }}
                                cleanable={false}
                            />
                        </Form.Group>
                    </div>

                    <Form.Group>
                        <Form.ControlLabel>Select Days</Form.ControlLabel>
                        <CheckboxGroup value={selectedDays} onChange={(value) => setSelectedDays(value as DayValue[])}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {DAYS.map(day => (
                                    <Checkbox key={day.value} value={day.value}>
                                        {day.label}
                                    </Checkbox>
                                ))}
                            </div>
                        </CheckboxGroup>
                    </Form.Group>

                    <Button appearance="ghost" onClick={handleGenerate} style={{ marginTop: '10px' }}>
                        {Object.values(timeSlices).some(daySlices => Array.isArray(daySlices) && daySlices.length > 0)
                            ? "Regenerate slices"
                            : "Generate slices"}
                    </Button>
                    {selectedDays.map((day) => {
                        const slices = timeSlices[day] || [];
                        const dayLabel = DAYS.find(d => d.value === day)?.label;

                        return (
                            <div key={day} style={{ marginTop: '16px' }}>
                                {/* <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>{dayLabel}</div> */}
                                <Button size="xs" onClick={() => handleAddSliceLeft(day)} style={{ padding: '0 6px' }}>
                                    +
                                </Button>
                                <span>{dayLabel}</span>
                                <Button size="xs" onClick={() => handleAddSliceRight(day)} style={{ padding: '0 6px' }}>
                                    +
                                </Button>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '8px',
                                        overflowX: 'auto',
                                        paddingBottom: '2px',
                                        paddingTop: '2px',
                                        maxHeight: '98px',
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: '#999 #f0f0f0',
                                        userSelect: 'none',
                                    }}
                                >

                                    {slices.map((slice, i) => {
                                        const displayFrom = slice.from;
                                        const displayTo = slice.to;

                                        const fromStr = displayFrom instanceof Date && !isNaN(displayFrom.getTime())
                                            ? displayFrom.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : 'Invalid Date';

                                        const toStr = displayTo instanceof Date && !isNaN(displayTo.getTime())
                                            ? displayTo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : 'Invalid Date';

                                        const facilityKey = facility?.facilityKey || 'unknown_facility';
                                        const resourceKey = selectedResource?.resourceKey || 'unknown_resource';
                                        const sliceId = `${facilityKey}_${resourceKey}_${day}_${i}_${fromStr}_${toStr}`;


                                        return (
                                            <div
                                                key={sliceId}
                                                style={{
                                                    // ... (نمط الـ CSS الخاص بالشريحة) ...
                                                    width: '100px',
                                                    height: '80px',
                                                    backgroundColor: slice.isBreak ? '#ffcfcf' : 'white',
                                                    border: '1.5px solid #ccc',
                                                    borderRadius: '10px',
                                                    fontSize: '12px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    position: 'relative',
                                                    flexShrink: 0,
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                                    cursor: 'default',
                                                    padding: '1px',
                                                    boxSizing: 'border-box',
                                                }}
                                            >
                                                <div style={{ fontWeight: 'bold' }}>{fromStr}</div>
                                                <div>{toStr}</div>

                                                {/* الأزرار تبقى كما هي */}
                                                <Button
                                                    onClick={() => handleToggleBreak(day, i)}
                                                    size="xs"
                                                    appearance={slice.isBreak ? 'primary' : 'subtle'}
                                                    color={slice.isBreak ? 'red' : undefined}
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: '2px',
                                                        right: '2px',
                                                        minWidth: '20px',
                                                        padding: '0',
                                                        height: '18px',
                                                        lineHeight: '18px',
                                                        fontSize: '12px',
                                                        borderRadius: '8px 0 0 8px',
                                                        userSelect: 'none',
                                                        boxShadow: 'none',
                                                    }}
                                                    title="Break Slot"
                                                >
                                                    B
                                                </Button>

                                                <Button
                                                    size="xs"
                                                    onClick={() => handleDeleteSlice(day, i)}
                                                    appearance={'subtle'}
                                                    color="red"
                                                    style={{
                                                        position: 'absolute',
                                                        top: '2px',
                                                        right: '2px',
                                                        minWidth: '17px',
                                                        padding: '-1px',
                                                        height: '18px',
                                                        lineHeight: '18px',
                                                        fontSize: '12px',
                                                        borderRadius: '8px 0 0 8px',
                                                        userSelect: 'none',
                                                        boxShadow: 'none',
                                                        cursor: 'pointer',
                                                    }}
                                                    title="Delete Slice "
                                                >
                                                    ×
                                                </Button>
                                            </div>
                                        );
                                    })}

                                </div>
                            </div>
                        );
                    })}



                </Form>
            </Modal.Body >
            <Modal.Footer>
                <Button onClick={handleSave} appearance="primary">Save</Button>
                <Button onClick={() => { handleCancel() }} appearance="subtle">Cancel</Button>
            </Modal.Footer>
        </Modal >
    );
};

export default NewAvailabilityTimeModal;
