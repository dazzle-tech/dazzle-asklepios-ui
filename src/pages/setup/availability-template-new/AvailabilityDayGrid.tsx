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
    start: string;
    end: string;
    applyAllChannels: boolean;
    slotDuration: number;
    startStep: number;
    strategy: string;
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




const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }) =>
    a.start < b.end && b.start < a.end;



const AvailabilityDayGrid = ({
    step,
    activeDay,
    setActiveDay,
    channels,
    availability,
    setAvailability,
    onAddChannel,
    onRemoveChannel,
    channelsDummyData,
    templatesData,
    setTemplatesData,
    template,
    day
}: {
    step: number;
    activeDay: number;
    setActiveDay: (day: number) => void;
    channels: Channel[];
    availability: AvailabilityByDay;
    setAvailability: React.Dispatch<React.SetStateAction<AvailabilityByDay>>;
    onAddChannel: (data: { name: string; color?: string }) => void;
    onRemoveChannel: (id: string) => void;
    channelsDummyData: any[],
    templatesData: any[],
    setTemplatesData: any,
    template: any,
    day: string
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

   

    const [intervalForm, setIntervalForm] = useState<IntervalForm>({
        start: '',
        end: '',
        applyAllChannels: false,
        slotDuration: step,
        startStep: step,
        strategy: '',
    });

  
    

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

                <div
                    // className="channel-column add-channel-column"
                    // onClick={() => setOpenAddChannel(true)}
                    style={{ display: "flex", padding: "5px" }}
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
                                            <AvailabilityIntervalCard
                                                start={interval.startTime}
                                                end={interval.endTime}
                                                slotLabel={interval.slotDuration}
                                                backgroundColor={t.color}
                                            />
                                        ))}
                                        <MyButton prefixIcon={() => <FaPlus />} width="300px" appearance='ghost' color={t.color ?? "#6982F0"} onClick={() => setOpenAddInterval(true)}>Add Interval</MyButton>
                                    </>
                                </div>
                            </>

                        ))}
                    </div>
                </div>
            </div>
            <AddIntervalModal
                step={step}
                record={intervalForm}
                setRecord={setIntervalForm}
                open={openAddInterval}
                setOpen={setOpenAddInterval}
                day={day}
            />
            <AddChannelModal
                open={openAddChannel}
                setOpen={setOpenAddChannel}
                record={channelForm}
                setRecord={(partial) =>
                    setChannelForm(prev => ({ ...prev, ...partial }))
                }
            />

        </div>
    );
};

export default AvailabilityDayGrid;
