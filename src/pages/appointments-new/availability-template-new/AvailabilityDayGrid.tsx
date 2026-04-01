import React, { useMemo, useCallback, useState, useEffect } from 'react';
import AvailabilityIntervalCard from './AvailabilityIntervalCard';
import './styles.less';
import AvailabilityTemplateSummaryCard from './AvailabilityTemplateSummaryCard';
import MyModal from '@/components/MyModal/MyModal';
import AddIntervalModal from './AddIntervalModal';
import MyInput from '@/components/MyInput';
import { Divider, Form } from 'rsuite';
import AddRoomModal from './AddRoomModal';
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

const AvailabilityDayGrid = ({
    step,
    activeDay,
    setActiveDay,
    channels,
    availability,
    setAvailability,
    onAddChannel,
    onRemoveChannel,
    // channelsDummyData,
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
    // channelsDummyData: any[],
    templatesData: any[],
    setTemplatesData: any,
    template: any,
    day: string
}) => {

    const [channelsDummyData, setChannelsDummyData] = useState([]);
    useEffect(() => {
        if (!template?.id) return;

        const freshTemplate = templatesData.find(t => t.id === template.id);

        setChannelsDummyData(
            freshTemplate?.channelsData?.[day] ?? []
        );
    }, [templatesData, template?.id, day]);
    const times = useMemo(() => generateDayTimes(step), [step]);
    const [openAddInterval, setOpenAddInterval] = useState(false);
    const [activeChannel, setActiveChannel] = useState({
        id: 0,
        channelName: "",
        type: "Practitioner",
        capacity: 0,
        allowedServices: [],
        color: "",
        intervals: [],
        slotsBefore: 0
    });
    const [openAddRoom, setOpenAddRoom] = useState(false);
    const [channelToAddInterval, setChannelToAddInterval] = useState({});



    const [intervalForm, setIntervalForm] = useState<IntervalForm>({
        start: '',
        end: '',
        applyAllChannels: false,
        slotDuration: template.step,
        startStep: step,
        strategy: '',
    });




  







    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: "2px" }}>
                <MyButton onClick={() => setOpenAddRoom(true)} prefixIcon={() => <FaPlus />} disabled={template?.id ? false : true}>Add Room</MyButton>
            </div>
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
                                                departmentCapacity={t.departmentCapacity}
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

                                            <MyButton prefixIcon={() => <FaPlus />} width="300px" appearance='ghost' color={t.color ?? "#6982F0"} onClick={() => { setChannelToAddInterval(t); setOpenAddInterval(true) }}>Add Interval</MyButton>
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
                    template={template}
                    templatesData={templatesData}
                    setTemplatesData={setTemplatesData}
                    channel={channelToAddInterval}
                />
                <AddRoomModal
                    open={openAddRoom}
                    setOpen={setOpenAddRoom}
                    record={activeChannel}
                    setRecord={setActiveChannel}
                    templatesData={templatesData}
                    setTemplatesData={setTemplatesData}
                    template={template}
                    day={day}

                />

            </div>
        </>
    );
};

export default AvailabilityDayGrid;
