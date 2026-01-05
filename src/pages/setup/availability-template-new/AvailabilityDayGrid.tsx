import React, { useMemo, useCallback, useState, useEffect } from 'react';
import AvailabilityIntervalCard from './AvailabilityIntervalCard';
import './styles.less';
import AvailabilityTemplateSummaryCard from './AvailabilityTemplateSummaryCard';
import MyModal from '@/components/MyModal/MyModal';
import AddIntervalModal from './AddIntervalModal';
import MyInput from '@/components/MyInput';
import { Divider, Form } from 'rsuite';
import AddChannelModal from './AddChannelModal';
import MyButton from '@/components/MyButton/MyButton';
import { FaPlus } from "react-icons/fa";

type Channel = {
    id: string;
    name: string;
    color?: string;
};

type IntervalForm = {
    start: Date | null;
    end: Date | null;
    applyAllChannels: boolean;
    slotDuration: number;
    startStep: number;
};

type Interval = {
    id: string;
    start: number;
    end: number;
    type?: 'NORMAL' | 'BREAK' | 'POOL';
    meta?: {
        name: string;
        capacity: number;
        step: number;
        slotsBefore: number;
        color?: string;
    };

};

type ChannelForm = {
    name: string;
    type: 'DEPARTMENT_POOL' | 'PRACTITIONER';
    facility?: string;
    department?: string;
    capacity: number;
    color?: string;

};

type ChannelAvailability = {
    channelId: string;
    intervals: Interval[];
};

type AvailabilityByDay = {
    [dayIndex: number]: ChannelAvailability[];
};

const generateDayTimes = (step: number) => {
    const times: { label: string; minutes: number }[] = [];
    for (let m = 0; m < 24 * 60; m += step) {
        const h = Math.floor(m / 60).toString().padStart(2, '0');
        const mm = (m % 60).toString().padStart(2, '0');
        times.push({ label: `${h}:${mm}`, minutes: m });
    }
    return times;
};

const formatMinutes = (m: number) => {
    const h = Math.floor(m / 60).toString().padStart(2, '0');
    const mm = (m % 60).toString().padStart(2, '0');
    return `${h}:${mm}`;
};

const dateToMinutes = (date: Date) =>
    date.getHours() * 60 + date.getMinutes();

const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }) =>
    a.start < b.end && b.start < a.end;

const calculateChannelCapacity = (
    availability: AvailabilityByDay,
    channelId: string
) => {
    let maxConcurrent = 0;

    Object.values(availability).forEach(day => {
        const intervals =
            day.find(c => c.channelId === channelId)?.intervals ?? [];

        for (let t = 0; t < 24 * 60; t += 5) {
            const concurrent = intervals.filter(
                i => t >= i.start && t < i.end && i.type !== 'BREAK'
            ).length;

            maxConcurrent = Math.max(maxConcurrent, concurrent);
        }
    });

    return maxConcurrent;
};

const AvailabilityDayGrid = ({
    step,
    activeDay,
    setActiveDay,
    channels,
    availability,
    setAvailability,
    onAddChannel,
    onRemoveChannel
}: {
    step: number;
    activeDay: number;
    setActiveDay: (day: number) => void;
    channels: Channel[];
    availability: AvailabilityByDay;
    setAvailability: React.Dispatch<React.SetStateAction<AvailabilityByDay>>;
    onAddChannel: (data: { name: string; color?: string }) => void;
    onRemoveChannel: (id: string) => void;
}) => {

    const times = useMemo(() => generateDayTimes(step), [step]);
    const [openAddInterval, setOpenAddInterval] = useState(false);
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
    const [openAddChannel, setOpenAddChannel] = useState(false);

    const [channelForm, setChannelForm] = useState<ChannelForm>({
        name: '',
        type: 'DEPARTMENT_POOL',
        facility: '',
        department: '',
        capacity: 1,
        color: '#4C7EF3'
    });

    React.useEffect(() => {
        console.log('[AvailabilityDayGrid] channelForm changed:', channelForm);
    }, [channelForm]);

    const [intervalForm, setIntervalForm] = useState<IntervalForm>({
        start: null,
        end: null,
        applyAllChannels: false,
        slotDuration: step,
        startStep: step
    });

    const channelsDummyData = [
        {
            id: 1,
            channelName: "Pediatrics Pool",
            type: "Department Pool",
            capacity: "3 concurrent",
            allowedServices: ["Vaccination", "Follow-up"],
            color: "#6982F0",
            intervals: [
                {
                    id: "int-101",
                    startTime: "09:00",
                    endTime: "12:30",
                    slotDuration: '30 minutes', // بالدقائق
                }
            ]
        },
        {
            id: 2,
            channelName: "Dr. Emma Johnson",
            type: "Practitioner",
            capacity: "1 patient",
            allowedServices: ["Vaccination", "Follow-up"],
            color: "#71946C",
            intervals: [
                {
                    id: "int-201",
                    startTime: "09:00",
                    endTime: "12:30",
                    slotDuration: '30 minutes',
                }
            ]
        },
        {
            id: 3,
            channelName: "Exam Room 1",
            type: "Resource",
            capacity: "1 concurrent",
            allowedServices: ["Vaccination", "Consultation"],
            color: "#8575A1",
            intervals: [
                {
                    id: "int-301",
                    startTime: "09:00",
                    endTime: "12:30",
                    slotDuration: '30 minutes',
                }
            ]
        }
    ];

    const getChannelIntervals = useCallback(
        (channelId: string) =>
            availability?.[activeDay]?.find(c => c.channelId === channelId)?.intervals ?? [],
        [availability, activeDay]
    );

    const upsertChannelAvailability = useCallback(
        (channelId: string, updater: (oldIntervals: Interval[]) => Interval[]) => {
            setAvailability(prev => {
                const dayData = prev[activeDay] ?? [];
                const existing = dayData.find(c => c.channelId === channelId);

                const oldIntervals = existing?.intervals ?? [];
                const nextIntervals = updater(oldIntervals);

                return {
                    ...prev,
                    [activeDay]: [
                        ...dayData.filter(c => c.channelId !== channelId),
                        { channelId, intervals: nextIntervals }
                    ]
                };
            });
        },
        [activeDay, setAvailability]
    );

    const addInterval = (channelId: string) => {
        const start = 10 * 60;
        const end = 11 * 60;

        upsertChannelAvailability(channelId, old => {
            if (old.some(i => overlaps({ start, end }, i))) return old;

            return [
                ...old,
                {
                    id: crypto.randomUUID(),
                    start,
                    end,
                    type: 'NORMAL'
                }
            ];
        });
    };

    const cellHeight = 36;
    const headerOffset = 36;

    const copyDayAvailability = (fromDay: number, toDay: number) => {
        setAvailability(prev => {
            const sourceDay = prev[fromDay];
            if (!sourceDay) return prev;

            const clonedDay: ChannelAvailability[] = sourceDay.map(channel => ({
                channelId: channel.channelId,
                intervals: channel.intervals.map(interval => ({
                    ...interval,
                    id: crypto.randomUUID(),
                    meta: interval.meta
                        ? { ...interval.meta }
                        : undefined
                }))
            }));

            return {
                ...prev,
                [toDay]: clonedDay
            };
        });
    };

    const daysOptions = [
        { label: 'Sunday', value: 0 },
        { label: 'Monday', value: 1 },
        { label: 'Tuesday', value: 2 },
        { label: 'Wednesday', value: 3 },
        { label: 'Thursday', value: 4 },
        { label: 'Friday', value: 5 },
        { label: 'Saturday', value: 6 }
    ];

    useEffect(() => {
        console.log('[AvailabilityDayGrid] channels prop:', channels);
    }, [channels]);

    const copyChannelAvailability = (
        fromDay: number,
        fromChannelId: string,
        toDay: number,
        toChannelId: string
    ) => {
        setAvailability(prev => {
            const sourceIntervals =
                prev[fromDay]
                    ?.find(c => c.channelId === fromChannelId)
                    ?.intervals ?? [];

            if (!sourceIntervals.length) return prev;

            const targetDayData = prev[toDay] ?? [];
            const targetChannel = targetDayData.find(c => c.channelId === toChannelId);

            const clonedIntervals = sourceIntervals.map(i => ({
                ...i,
                id: crypto.randomUUID(),
                meta: i.meta ? { ...i.meta } : undefined
            }));

            return {
                ...prev,
                [toDay]: [
                    ...targetDayData.filter(c => c.channelId !== toChannelId),
                    {
                        channelId: toChannelId,
                        intervals: clonedIntervals
                    }
                ]
            };
        });
    };

    return (
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
                {channels.map(channel => {
                    const intervals = getChannelIntervals(channel.id);

                    return (
                        <div key={channel.id} className="channel-column">
                            <div className="channel-header">
                                <span>{channel.name}</span>
                                <button
                                    className="remove-channel-btn"
                                    onClick={() => onRemoveChannel(channel.id)}
                                    type="button"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="channel-interval-layer">
                                {intervals.map(interval => {
                                    const top = headerOffset + (interval.start / step) * cellHeight;
                                    const height = ((interval.end - interval.start) / step) * cellHeight;
                                    const pool = intervals.find(i => i.type === 'POOL');
                                    const inheritedColor = pool?.meta?.color ?? channel.color;

                                    return (
                                        <div
                                            key={interval.id}
                                            style={{
                                                position: 'absolute',
                                                top,
                                                height,
                                                left: 4,
                                                right: 4,
                                                zIndex: interval.type === 'POOL' ? 4 : 5
                                            }}
                                        >
                                            {interval.type === 'POOL' ? (
                                                <AvailabilityTemplateSummaryCard
                                                    name={interval.meta?.name ?? ''}
                                                    capacity={interval.meta?.capacity ?? 0}
                                                    step={interval.meta?.step ?? step}
                                                    slotsBefore={interval.meta?.slotsBefore ?? 0}
                                                    color={interval.meta?.color}
                                                />


                                            ) : (
                                                <AvailabilityIntervalCard
                                                    // start={formatMinutes(interval.start)}
                                                    // end={formatMinutes(interval.end)}
                                                    // slotLabel={`${step} minutes`}
                                                    // type={interval.type}
                                                    // color={inheritedColor}
                                                    // onDelete={() =>
                                                    //     upsertChannelAvailability(channel.id, old =>
                                                    //         old.filter(i => i.id !== interval.id)
                                                    //     )
                                                    // }
                                                    title="Test"
                                                    type="Department"
                                                    capacity="2"
                                                    services={['service1', 'service2']}
                                                    onSettingsClick={null}
                                                />

                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {times.map(t => (
                                <div
                                    key={t.minutes}
                                    className="channel-cell"
                                    data-minutes={t.minutes}
                                />
                            ))}

                            <div className="channel-footer">
                                <button
                                    className="channel-footer-btn"
                                    onClick={() => {
                                        setActiveChannelId(channel.id);
                                        setIntervalForm({
                                            start: null,
                                            end: null,
                                            applyAllChannels: false,
                                            slotDuration: step,
                                            startStep: step
                                        });
                                        setOpenAddInterval(true);
                                    }}
                                >
                                    + Add Interval
                                </button>

                                <button
                                    className="channel-footer-btn secondary">
                                    📋 Copy day to
                                </button>


                            </div>
                        </div>
                    );
                })}

                <div
                    // className="channel-column add-channel-column"
                    // onClick={() => setOpenAddChannel(true)}
                    style={{display: "flex", padding: "5px"}}
                >

                    <div style={{ display: "flex" }}>
                        {channelsDummyData.map(t => (
                            <>
                                <div key={t.id}
                                    style={{
                                        width: "320px",
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}
                                // className="channel-cell add-channel-cell"
                                ><>
                                        <AvailabilityTemplateSummaryCard
                                            title={t.channelName}
                                            type={t.type}
                                            capacity={t.capacity}
                                            services={t.allowedServices}
                                            backgroundColor={t.color}
                                        />
                                        {t?.intervals?.map(interval => (
                                            // className="channel-cell add-channel-cell"




                                            <AvailabilityIntervalCard
                                                start={interval.startTime}
                                                end={interval.endTime}
                                                slotLabel={interval.slotDuration}
                                                backgroundColor={t.color}
                                            // type={interval.}
                                            />
                                        ))}
                                        <MyButton prefixIcon={() => <FaPlus />} width="300px" appearance='ghost' color={t.color ?? "#6982F0"}>Add Interval</MyButton>
                                        <MyButton prefixIcon={() => <FaPlus />} width="300px" appearance='ghost' color={t.color ?? "#6982F0"}>Add Break</MyButton>
                                        {/* <Divider vertical /> */}
                                    </>
                                </div>
                                {/* <Divider vertical /> */}
                            </>

                        ))}
                    </div>

                    {/* <h2>hi</h2> */}
                    {/* <div className="channel-header add-channel-header">＋ Add Channel</div> */}
                    {/* {times.map(t => (
                        <div key={t.minutes} className="channel-cell add-channel-cell" />
                    ))} */}
                    {/* <MyButton>Add Channel</MyButton> */}
                </div>
            </div>


            <MyModal
                open={openAddInterval}
                setOpen={setOpenAddInterval}
                title="Add Interval"
                size="40vw"
                content={
                    <AddIntervalModal
                        step={step}
                        record={intervalForm}
                        setRecord={setIntervalForm}
                    />
                }
                actionButtonLabel="Save"
                isDisabledActionBtn={
                    intervalForm.start === null ||
                    intervalForm.end === null ||
                    intervalForm.end <= intervalForm.start
                }
                actionButtonFunction={() => {
                    if (!activeChannelId) return;

                    const { start, end, applyAllChannels } = intervalForm;
                    if (!start || !end) return;

                    const startMinutes = start.getHours() * 60 + start.getMinutes();
                    const endMinutes = end.getHours() * 60 + end.getMinutes();

                    const addToChannel = (channelId: string) => {
                        const channelData = channels.find(c => c.id === channelId);
                        if (!channelData) return;

                        upsertChannelAvailability(channelId, old => [
                            ...old,
                            {
                                id: crypto.randomUUID(),
                                start: startMinutes,
                                end: endMinutes,
                                type: 'NORMAL'
                            }

                        ]);
                    };


                    if (applyAllChannels) {
                        channels.forEach(c => addToChannel(c.id));
                    } else {
                        addToChannel(activeChannelId);
                    }

                    setOpenAddInterval(false);
                }}

            />





            <MyModal
                open={openAddChannel}
                setOpen={setOpenAddChannel}
                title="Add Channel"
                size="40vw"
                content={
                    <AddChannelModal
                        record={channelForm}
                        setRecord={(partial) =>
                            setChannelForm(prev => ({ ...prev, ...partial }))
                        }
                    />
                }
                actionButtonLabel="Add"
                isDisabledActionBtn={
                    !channelForm.name?.trim() || channelForm.capacity < 1
                }
                actionButtonFunction={() => {
                    const payload = {
                        name: channelForm.name.trim(),
                        color: channelForm.color
                    };

                    console.log('[AvailabilityDayGrid] onAddChannel payload:', payload);

                    onAddChannel(payload);

                    setChannelForm({
                        name: '',
                        type: 'DEPARTMENT_POOL',
                        facility: '',
                        department: '',
                        capacity: 1,
                        color: '#4C7EF3'
                    });

                    setOpenAddChannel(false);
                }}

            />




        </div>
    );
};

export default AvailabilityDayGrid;
