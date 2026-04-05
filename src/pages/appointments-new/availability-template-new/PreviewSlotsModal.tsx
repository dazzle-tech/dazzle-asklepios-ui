
import React, { useEffect, useMemo, useState } from 'react';
import { Divider, Tabs } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import './PreviewCalendar.less';
import DateNavigator from './DateNavigator';
import AvailabilityTemplateSummaryCard from './AvailabilityTemplateSummaryCard';
import AvailabilityIntervalCard from './AvailabilityIntervalCard';
import SlotCard from './SlotCard';
import { IoWarning } from "react-icons/io5";
import { useEnumOptions } from '@/services/enumsApi';

type Channel = {
    id: string;
    name: string;
    color?: string;
};

type Interval = {
    id: string;
    start: number;
    end: number;
    type?: 'NORMAL' | 'POOL';
    meta?: {
        name?: string;
        capacity?: number;
        slotsBefore?: number;
    };
};

type ChannelAvailability = {
    channelId: string;
    intervals: Interval[];
};

type AvailabilityByDay = {
    [dayIndex: number]: ChannelAvailability[];
};

type Props = {
    open: boolean;
    onClose: () => void;
    templateName: string;
    step: number;
    channelsByDay: { [dayIndex: number]: Channel[] };
    availability: AvailabilityByDay;
    slotsBeforeAfter: number;
};

const daysEnum = useEnumOptions("DayOfWeek");

const formatMinutes = (m: number) => {
    const h = Math.floor(m / 60).toString().padStart(2, '0');
    const mm = (m % 60).toString().padStart(2, '0');
    return `${h}:${mm}`;
};

const timeToMinutes = (timeStr: string) => {
    const [hrs, mins] = timeStr.split(':').map(Number);
    return hrs * 60 + mins;
};

const minutesToTime = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const m = (totalMinutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
};

const PreviewSlotsModal: React.FC<Props> = ({ open, onClose, templateName, step, channelsByDay, availability, slotsBeforeAfter }) => {
    const [activeDay, setActiveDay] = useState(0);
    const [currentDate, setCurrentDate] = useState(
        new Date('2026-01-06')
    );

    const channelsDataByDate = {
        "2026-01-06": [
            {
                id: 1,
                channelName: "Pediatrics Pool",
                type: "Department Pool",
                capacity: "3 concurrent",
                allowedServices: ["Vaccination", "Follow-up"],
                color: "#6982F0",
                intervals: [
                    { id: "int-101", startTime: "09:00", endTime: "12:30", slotDuration: 30 },
                    { id: "int-101", startTime: "14:00", endTime: "17:30", slotDuration: 20 },
                ],
            },
            {
                id: 2,
                channelName: "Dr. Emma Johnson",
                type: "Practitioner",
                capacity: "1 patient",
                allowedServices: ["Consultation"],
                color: "#71946C",
                intervals: [
                    { id: "int-102", startTime: "10:00", endTime: "14:00", slotDuration: 20 },
                ],
            },
            {
                id: 3,
                channelName: "Exam Room 1",
                type: "Resource",
                capacity: "1 concurrent",
                allowedServices: ["Consultation"],
                color: "#8575A1",
                intervals: [
                    { id: "int-103", startTime: "08:30", endTime: "12:00", slotDuration: 30 },
                ],
            },
        ],
        "2026-01-07": [
            {
                id: 4,
                channelName: "Orthodontics Pool",
                type: "Department Pool",
                capacity: "2 concurrent",
                allowedServices: ["Braces Check"],
                color: "#F08A5D",
                intervals: [
                    { id: "int-201", startTime: "09:00", endTime: "13:00", slotDuration: 30 },
                ],
            },
            {
                id: 5,
                channelName: "Dr. Michael Smith",
                type: "Practitioner",
                capacity: "1 patient",
                allowedServices: ["Surgery Consultation"],
                color: "#6A9FB5",
                intervals: [
                    { id: "int-202", startTime: "11:00", endTime: "15:00", slotDuration: 40 },
                ],
            },
            {
                id: 6,
                channelName: "X-Ray Room",
                type: "Resource",
                capacity: "1 concurrent",
                allowedServices: ["X-Ray"],
                color: "#B83B5E",
                intervals: [
                    { id: "int-203", startTime: "08:00", endTime: "12:00", slotDuration: 15 },
                ],
            },
        ],
        "2026-01-08": [
            {
                id: 7,
                channelName: "Preventive Care Pool",
                type: "Department Pool",
                capacity: "4 concurrent",
                allowedServices: ["Cleaning", "Check-up"],
                color: "#4ECDC4",
                intervals: [
                    { id: "int-301", startTime: "07:30", endTime: "11:30", slotDuration: 30 },
                ],
            },
            {
                id: 8,
                channelName: "Dr. Sarah Lee",
                type: "Practitioner",
                capacity: "1 patient",
                allowedServices: ["Follow-up"],
                color: "#3D5A80",
                intervals: [
                    { id: "int-302", startTime: "12:00", endTime: "16:00", slotDuration: 20 },
                ],
            },
            {
                id: 9,
                channelName: "Exam Room 2",
                type: "Resource",
                capacity: "1 concurrent",
                allowedServices: ["Consultation"],
                color: "#9A8C98",
                intervals: [
                    { id: "int-303", startTime: "09:30", endTime: "13:30", slotDuration: 30 },
                ],
            },
        ],
    };

    const [currentData, setCurrentData] = useState([]);

    useEffect(() => {
        const availableDays = Object.keys(availability).map(Number);
        if (availableDays.length) setActiveDay(availableDays[0]);
    }, [availability]);

    const formatDateKey = (date: Date) => {
        return date.toISOString().split("T")[0];
    };

    useEffect(() => {
        const dateKey = formatDateKey(currentDate);
        const dataForDate = channelsDataByDate[dateKey] || [];
        setCurrentData(dataForDate);
    }, [currentDate]);


    const generateDayTimes = (step: number) => {
        const times: { label: string; minutes: number }[] = [];
        for (let m = 0; m < 24 * 60; m += step) {
            const h = Math.floor(m / 60).toString().padStart(2, '0');
            const mm = (m % 60).toString().padStart(2, '0');
            times.push({ label: `${h}:${mm}`, minutes: m });
        }
        return times;
    };

    const times = useMemo(() => generateDayTimes(step), [step]);

    return (
        <MyModal
            open={open}
            setOpen={onClose}
            size="md"
            hideActionBtn
            title={
                <div className="preview-title">
                    <Translate>Preview slots</Translate>
                    <span className="preview-title-muted">{templateName}</span>
                </div>
            }
            content={
                <>
                    <DateNavigator
                        from={new Date('2026-01-06')}
                        to={new Date('2026-01-08')}
                        currentDate={currentDate}
                        setCurrentDate={setCurrentDate}
                    />
                    <Divider />
                    <div style={{display: "flex", gap: '2px'}}>
                      <IoWarning color='#CCCC23' size={22}/>
                     <Translate>Note: Exceptions & Closures may impact slot availability on this date.</Translate>
                    </div>
                    <Divider />
                    <div className="calendar-wrapper">
                        <div className="time-column">
                            <div className="time-header">Time</div>
                            {times.map(t => (
                                <div key={t.minutes} className="time-cell">
                                    {t.label}
                                </div>
                            ))}
                        </div>
                        <div className="channels-wrapper">
                            <div style={{ display: "flex", padding: "5px" }} >
                                {currentData.map(t => (
                                    <div key={t.id} style={{ width: "320px", display: "flex", flexDirection: "column", gap: "8px", }} >
                                        <AvailabilityTemplateSummaryCard
                                            title={t.channelName}
                                            type={t.type}
                                            capacity={t.capacity}
                                            departmentCapacity={t.departmentCapacity}
                                            services={t.allowedServices}
                                            backgroundColor={t.color}
                                        />
                                        
                                        {t.intervals.map((interval: any) => {
                                            const slotsList = [];
                                            const intervalStartMins = timeToMinutes(interval.startTime);
                                            const intervalEndMins = timeToMinutes(interval.endTime);
                                            
                                            const totalSlotDuration = interval.slotDuration + (slotsBeforeAfter * 2);
                                            
                                            let currentPointer = intervalStartMins - slotsBeforeAfter;

                                            while (currentPointer + totalSlotDuration <= intervalEndMins + slotsBeforeAfter) {
                                                const slotStart = currentPointer;
                                                const slotEnd = currentPointer + totalSlotDuration;

                                                slotsList.push({
                                                    displayTime: `${minutesToTime(slotStart)} - ${minutesToTime(slotEnd)}`,
                                                });

                                                currentPointer = slotEnd; 
                                            }

                                            return (
                                                <React.Fragment key={interval.id}>
                                                    {slotsList.map((slot, idx) => (
                                                        <SlotCard 
                                                            key={idx} 
                                                            time={slot.displayTime} 
                                                            slots={t.capacity.split(' ')[0]} 
                                                            status="New" 
                                                            backgroundColor={t.color}
                                                        />
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            }
        />
    );
};

export default PreviewSlotsModal;
