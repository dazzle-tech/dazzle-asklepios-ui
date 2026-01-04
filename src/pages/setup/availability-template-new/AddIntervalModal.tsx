import React from 'react';
import { Form, Checkbox, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import './AddIntervalModal.less';

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
    start: Date | null;
    end: Date | null;
    applyAllChannels: boolean;
    slotDuration: number;
    startStep: number;
};

/* ===================== COMPONENT ===================== */

const AddIntervalModal = ({
    step,
    dayLabel = 'Sunday',
    record,
    setRecord
}: {
    step: number;
    dayLabel?: string;
    record: IntervalRecord;
    setRecord: React.Dispatch<React.SetStateAction<IntervalRecord>>;
}) => {
    return (
        <Form fluid className="add-interval-modal">
            <div className="day-title">{dayLabel}</div>

            <h6>
                <Translate>Interval</Translate>
            </h6>

            <div className="interval-row">
                <MyInput
                    fieldName="start"
                    fieldType="time"
                    record={record}
                    setRecord={setRecord}
                    placeholder="Start Time"
                    width="100%"
                />

                <MyInput
                    fieldName="end"
                    fieldType="time"
                    record={record}
                    setRecord={setRecord}
                    placeholder="End Time"
                    width="100%"
                />
            </div>

            {record.start && record.end && record.end > record.start && (
                <div className="interval-duration-bar">
                    {formatDuration(record.start, record.end)}
                </div>
            )}

            <Checkbox
                checked={record.applyAllChannels}
                onChange={(_, checked) =>
                    setRecord(prev => ({ ...prev, applyAllChannels: checked }))
                }
            >
                <Translate>Apply to all channels on</Translate> {dayLabel}
            </Checkbox>

            <Divider />

            <h6>
                <Translate>Slot Strategy</Translate>
            </h6>

            <div className="slot-strategy-row">
                <MyInput
                    fieldName="strategy"
                    showLabel={false}
                    fieldType="select"
                    record={{ strategy: 'FIXED' }}
                    disabled
                    selectData={[{ label: 'Fixed Duration', value: 'FIXED' }]}
                    selectDataLabel="label"
                    selectDataValue="value"
                    width="15vw"
                />
        <Form fluid layout='inline'>

                <MyInput
                    fieldName="slotDuration"
                    fieldType="number"
                    record={record}
                    setRecord={setRecord}
                    width={"15vw"}
                    rightAddon="min"
                />
        </Form>
            </div>

            <MyInput
                fieldName="startStep"
                fieldType="select"
                record={record}
                setRecord={setRecord}
                selectData={[
                    { label: '5 mins', value: 5 },
                    { label: '10 mins', value: 10 },
                    { label: '15 mins', value: 15 }
                ]}
                selectDataLabel="label"
                selectDataValue="value"
                width={200}
            />

            {/* ================= Preview ================= */}
            <div className="slot-preview">
                08:00 - 08:30 - 09:00 - … - 12:30
            </div>

            <Divider />
            {/* <h6>
                <Translate>Optional Breaks</Translate>
            </h6>

            <div className="add-break">
                + <Translate>Add break</Translate>
            </div>

            <div className="break-note">
                <Translate>Breaks subtract from working time.</Translate>
            </div>  */}
        </Form>
    );
};

export default AddIntervalModal;














