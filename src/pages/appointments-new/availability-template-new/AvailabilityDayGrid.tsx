import React, { useMemo, useCallback, useState, useEffect } from 'react';
import AvailabilityIntervalCard from './AvailabilityIntervalCard';
import './styles.less';
import AvailabilityTemplateSummaryCard from './AvailabilityTemplateSummaryCard';
import MyModal from '@/components/MyModal/MyModal';
import AddIntervalModal from './AddIntervalModal';
import MyInput from '@/components/MyInput';
import { Divider, Form } from 'rsuite';
import AddRoomModal from './AddResourceModal';
import MyButton from '@/components/MyButton/MyButton';
import { FaPlus } from "react-icons/fa";





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
    templates,
    parentTemplate
}: {

      templates: any;
    parentTemplate: any

    // step: number;
    // activeDay: number;
    // setActiveDay: (day: number) => void;
    // channels: Channel[];
    // availability: AvailabilityByDay;
    // setAvailability: React.Dispatch<React.SetStateAction<AvailabilityByDay>>;
    // onAddChannel: (data: { name: string; color?: string }) => void;
    // onRemoveChannel: (id: string) => void;
    // // channelsDummyData: any[],
    // templatesData: any[],
    // setTemplatesData: any,
    // template: any,
    // day: string
}) => {

    const [channelsDummyData, setChannelsDummyData] = useState([]);
    
    const times = 
    // useMemo(() =>
         generateDayTimes(120)
    // , [120]);
    const [openAddInterval, setOpenAddInterval] = useState(false);
    
    const [channelToAddInterval, setChannelToAddInterval] = useState({});




// const mergedArray = (parentTemplate && templates) ? [parentTemplate, ...templates?.data] : parentTemplate ? [parentTemplate] : templates ? [templates?.data] : [];
const mergedArray = [
  ...(parentTemplate?.id ? [parentTemplate] : []),
  ...(Array.isArray(templates) ? templates : [])
];


    return (
        <>
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
                      
                        style={{ display: "flex", padding: "5px" }}
                    >

                        <div style={{ display: "flex" }}>
                            {mergedArray.map(t => (
                                <>
                                    <div key={t?.id}
                                        style={{
                                            width: "320px",
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px'
                                        }}
                                    // className="channel-cell add-channel-cell"
                                    ><>
                                            <AvailabilityTemplateSummaryCard
                                                title={t?.templateName}
                                                type={t?.templateType}
                                                capacity="1"
                                                departmentCapacity={"test"}
                                                services={["test", "test2"]}
                                                backgroundColor={t?.templateColor}
                                            />
                                            {/* {t?.intervals?.map(interval => (
                                                <AvailabilityIntervalCard
                                                    start={interval.startTime}
                                                    end={interval.endTime}
                                                    slotLabel={interval.slotDuration}
                                                    backgroundColor={t.color}
                                                />
                                            ))} */}

                                            <MyButton prefixIcon={() => <FaPlus />} width="300px" appearance='ghost' color={t?.templateColor ?? "#6982F0"} onClick={() => { setChannelToAddInterval(t); setOpenAddInterval(true) }}>Add Interval</MyButton>
                                        </>
                                    </div>
                                </>

                            ))}
                        </div>
                    </div>
                </div>
                {/* <AddIntervalModal
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
                /> */}
                

            </div>
        </>
    );
};

export default AvailabilityDayGrid;
