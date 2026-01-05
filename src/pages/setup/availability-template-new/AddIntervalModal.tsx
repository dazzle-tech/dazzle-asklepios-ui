import React from 'react';
import { Form, Checkbox, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import './AddIntervalModal.less';
import MyModal from '@/components/MyModal/MyModal';

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
    strategy: string
};

/* ===================== COMPONENT ===================== */

const AddIntervalModal = ({
    step,
    dayLabel = 'Sunday',
    record,
    setRecord,
    open,
    setOpen
}: {
    step: number;
    dayLabel?: string;
    record: IntervalRecord;
    setRecord: React.Dispatch<React.SetStateAction<IntervalRecord>>;
    open: boolean;
    setOpen: any;
}) => {

    const conjureFormContent = (stepNumber = 0) => {
        switch (stepNumber) {
            case 0:
                return (
                    <Form fluid className="add-interval-modal">
                        <div className="day-title">{dayLabel}</div>
                        <Divider />
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
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

                        {/* <Checkbox
                checked={record.applyAllChannels}
                onChange={(_, checked) =>
                    setRecord(prev => ({ ...prev, applyAllChannels: checked }))
                }
            >
                <Translate>Apply to all channels on</Translate> {dayLabel}
            </Checkbox> */}

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
                                selectData={[{ label: 'Fixed Duration', value: 'FIXED' },{ label: 'As Department Pool', value: 'asDepartmentPool' }]}
                                selectDataLabel="label"
                                selectDataValue="value"
                                width="15vw"
                            />
                            {/* <Form fluid layout='inline'> */}

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
                            08:00 - 08:30 - 09:00 - … - 12:30
                        </div>

                        <Divider />

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
            // isDisabledActionBtn={
            //     intervalForm.start === null ||
            //     intervalForm.end === null ||
            //     intervalForm.end <= intervalForm.start
            // }
            actionButtonFunction={() => {
                // if (!activeChannelId) return;

                // const { start, end, applyAllChannels } = intervalForm;
                // if (!start || !end) return;

                // const startMinutes = start.getHours() * 60 + start.getMinutes();
                // const endMinutes = end.getHours() * 60 + end.getMinutes();

                // const addToChannel = (channelId: string) => {
                //     const channelData = channels.find(c => c.id === channelId);
                //     if (!channelData) return;

                //     upsertChannelAvailability(channelId, old => [
                //         ...old,
                //         {
                //             id: crypto.randomUUID(),
                //             start: startMinutes,
                //             end: endMinutes,
                //             type: 'NORMAL'
                //         }

                //     ]);
                // };


                // if (applyAllChannels) {
                //     channels.forEach(c => addToChannel(c.id));
                // } else {
                //     addToChannel(activeChannelId);
                // }

                // setOpenAddInterval(false);
            }}
        />
    );
};

export default AddIntervalModal;














