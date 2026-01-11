import React, { useEffect, useState } from 'react';
import { Form, Checkbox, Divider, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import './AddIntervalModal.less';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import { FaPlus } from "react-icons/fa";
/* ===================== HELPERS ===================== */

const formatDuration = (start: Date, end: Date) => {
    const diffMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;

    if (h > 0 && m > 0) return `${h} hr ${m} mins`;
    if (h > 0) return `${h} hr`;
    return `${m} mins`;
};

/* ===================== TYPES ===================== */

type IntervalRecord = {
    start: string;
    end: string;
    applyAllChannels: boolean;
    slotDuration: number;
    strategy: string
};

/* ===================== COMPONENT ===================== */

const AddIntervalModal = ({
    step,
    dayLabel = 'Sunday',
    record,
    setRecord,
    open,
    setOpen,
    day,
    template
}: {
    step: number;
    dayLabel?: string;
    record: IntervalRecord;
    setRecord: React.Dispatch<React.SetStateAction<IntervalRecord>>;
    open: boolean;
    setOpen: any;
    day: string;
    template: any
}) => {
    // const [record, setRecord] = useState({});
    const timeToMinutes = (timeStr: string) => {
        const [hrs, mins] = timeStr?.split(':').map(Number);
        return hrs * 60 + mins;
    };

    const minutesToTime = (totalMinutes: number) => {
        const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
        const m = (totalMinutes % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    };
    function formatTime(date: Date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    const slotDuration = 30;
    const slotBeforeAfter = 5;
    const [slots, setSlots] = useState([]);
    useEffect(() => {
        console.log("slotDuration", record?.slotDuration);
         console.log("start: ", record?.start);
         console.log("end: ", record?.end);
        if (record.start && record.end) {
            console.log("in if");
            const slotsList = [];
            const intervalStartMins = timeToMinutes(formatTime(record.start));
            const intervalEndMins = timeToMinutes(formatTime(record.end));

            const totalSlotDuration = Number(record.slotDuration)  + (slotBeforeAfter * 2);

            let currentPointer = intervalStartMins - slotBeforeAfter;

            console.log("intervalStartMins: ", intervalStartMins);
            console.log("intervalEndMins: ", intervalEndMins);
            console.log("totalSlotDuration: ", totalSlotDuration);
            console.log("currentPointer: ", currentPointer);

            while (currentPointer + totalSlotDuration <= intervalEndMins + slotBeforeAfter) {
                const slotStart = currentPointer;
                const slotEnd = currentPointer + totalSlotDuration;

                slotsList.push({
                    displayTime: `${minutesToTime(slotStart)} - ${minutesToTime(slotEnd)}`,
                });

                currentPointer = slotEnd;
            }
            setSlots(slotsList);
        }

    }, [record?.start, record?.end, record?.slotDuration]);
    console.log("slots: ", slots);

    useEffect(() => {
        if(record.strategy === "asDepartmentPool"){
            setRecord({...record, slotDuration: template.step})
        }
    },[record.strategy]);

    const [displayAddBreakFields, setDisplayAddBreakFields] = useState<boolean>(false);
    const conjureFormContent = (stepNumber = 0) => {
        switch (stepNumber) {
            case 0:
                return (
                    <Form fluid className="add-interval-modal">
                        <div className="day-title">{dayLabel}</div>
                        <Divider />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h6>
                                <Translate>Interval</Translate>
                            </h6>
                            <Checkbox
                                checked={record.applyAllChannels}
                                onChange={(_, checked) =>
                                    setRecord(prev => ({ ...prev, applyAllChannels: checked }))
                                }
                            >
                                <Translate>Apply to all channels on</Translate> {dayLabel}
                            </Checkbox>
                        </div>
                        <div className="interval-row">
                            <MyInput
                                fieldName="start"
                                fieldType="time"
                                record={record}
                                setRecord={setRecord}
                                fieldLabel='Start Time'
                                placeholder="Start Time"
                                width="100%"
                            />

                            <MyInput
                                fieldName="end"
                                fieldType="time"
                                record={record}
                                setRecord={setRecord}
                                placeholder="End Time"
                                fieldLabel='End Time'
                                width="100%"
                            />
                        </div>

                        {record.start && record.end && record.end > record.start && (
                            <div className="interval-duration-bar">
                                {formatDuration(record.start, record.end)}
                            </div>
                        )}
                        <Divider />

                        <h6>
                            <Translate>Slot Strategy</Translate>
                        </h6>

                        <div className="slot-strategy-row">
                            <Form fluid layout='inline'>
                                <MyInput
                                    fieldName="strategy"
                                    fieldType="select"
                                    record={record}
                                    setRecord={setRecord}
                                    selectData={[{ label: 'Fixed Duration', value: 'FIXED' }, { label: 'As Department Pool', value: 'asDepartmentPool' }]}
                                    selectDataLabel="label"
                                    selectDataValue="value"
                                    width="15vw"
                                />

                                <MyInput
                                    fieldName="slotDuration"
                                    fieldType="number"
                                    record={record}
                                    setRecord={setRecord}
                                    width={"15vw"}
                                    rightAddon="min"
                                    disabled={record.strategy === "asDepartmentPool"}
                                />
                            </Form>
                        </div>



                        {/* ================= Preview ================= */}
                        <div className="slot-preview">
                            {(() => {
                                if (!slots || slots.length === 0) {
                                    return 'select a start and end time to display available slots';
                                }
                                return slots.map(s => s.displayTime).join(' , ');
                            })()}
                        </div>


                        <Divider />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <MyButton prefixIcon={() => <FaPlus />} onClick={() => setDisplayAddBreakFields(!displayAddBreakFields)}>Add Break</MyButton>
                        </div>
                        {displayAddBreakFields && (
                            <div className="interval-row">
                                <MyInput
                                    fieldName="startBreak"
                                    fieldType="time"
                                    record={record}
                                    setRecord={setRecord}
                                    fieldLabel='Start Time Break'
                                    placeholder="Start Time Break"
                                    width="100%"
                                />

                                <MyInput
                                    fieldName="endBreak"
                                    fieldType="time"
                                    record={record}
                                    setRecord={setRecord}
                                    placeholder="End Time Break"
                                    fieldLabel='End Time Break'
                                    width="100%"
                                />
                            </div>
                        )}
                    </Form>
                );
            default:
                return null;
        }
    };
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add Interval"
            size="40vw"
            content={conjureFormContent}
            actionButtonLabel="Save"
            actionButtonFunction={() => {

            }}
        />
    );
};

export default AddIntervalModal;
