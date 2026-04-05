import React, { useEffect, useState } from 'react';
import { Form, Checkbox, Divider, Row, CheckboxGroup } from 'rsuite';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import './AddIntervalModal.less';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import { FaPlus } from "react-icons/fa";
import { AvailabilityTemplateIntervalCreateDTO } from '@/types/model-types-new';
import { newAvailabilityTemplateIntervalCreateDTO } from '@/types/model-types-constructor-new';
import { formatEnumString } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import { useCreateAvailabilityTemplateIntervalMutation } from '@/services/appointment/availabilityTemplate/availabilityTemplateInterval';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';

/* ===================== COMPONENT ===================== */

const AddIntervalModal = ({
    // step,
    // dayLabel = 'Sunday',
    // record,
    // setRecord,
    open,
    setOpen,
    // day,
    // template,
    // templatesData,
    // setTemplatesData,
    // channel
    resource,
    day
}: {
    // step: number;
    // dayLabel?: string;
    // record: IntervalRecord;
    // setRecord: React.Dispatch<React.SetStateAction<IntervalRecord>>;
    open: boolean;
    setOpen: any;
    // day: string;
    // template: any;
    // templatesData: any;
    // setTemplatesData: any;
    // channel: any;
    resource: any;
    day: string;
}) => {
    const [record, setRecord] = useState<AvailabilityTemplateIntervalCreateDTO>({...newAvailabilityTemplateIntervalCreateDTO});
    const dispatch = useAppDispatch();
   
    const serviceOptions = [
  { label: 'Vaccination', value: 'VACCINATION' },
  { label: 'Follow-up', value: 'FOLLOW_UP' },
  { label: 'Consultation', value: 'CONSULTATION' }
];
   

    const slotStrategyEnum = useEnumOptions('SlotStrategy');
    const [createAvailabilityTemplateInterval] = useCreateAvailabilityTemplateIntervalMutation();
    const conjureFormContent = (stepNumber = 0) => {
        switch (stepNumber) {
            case 0:
                return (
                    <Form fluid className="add-interval-modal">
                        <div className="day-title">{formatEnumString(day)}</div>
                        <Divider />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h6>
                                <Translate>Interval</Translate>
                            </h6>
                            
                        </div>
                        <div className="interval-row">
                            <MyInput
                                fieldName="startTime"
                                fieldType='time'
                                record={record}
                                setRecord={setRecord}
                                placeholder="Start Time"
                                width="100%"
                                required
                            />

                            <MyInput
                                fieldName="endTime"
                                fieldType="time"
                                record={record}
                                setRecord={setRecord}
                                placeholder="End Time"
                                width="100%"
                                required
                            />
                        </div>
                        <div className="block">
                            <Translate>Services Allowed (optional):</Translate>
                            <CheckboxGroup
                                inline
                                
                            >
                                {serviceOptions.map(s => (
                                    <Checkbox key={s.value} value={s.value}>
                                        {s.label}
                                    </Checkbox>
                                ))}
                            </CheckboxGroup>
                        </div>

                        <Divider />

                        <h6>
                            <Translate>Slot Strategy</Translate>
                        </h6>

                        <div className="slot-strategy-row">
                            <Form fluid layout='inline'>
                                <MyInput
                                    fieldName="slotStrategy"
                                    fieldType="select"
                                    record={record}
                                    setRecord={setRecord}
                                    selectData={slotStrategyEnum ?? []}
                                    selectDataLabel="label"
                                    selectDataValue="value"
                                    width="15vw"
                                />

                                <MyInput
                                    fieldName="slotDurationMinutes"
                                    fieldType="number"
                                    record={record}
                                    setRecord={setRecord}
                                    width={"15vw"}
                                    rightAddon="min"
                                    fieldLabel='Duration'
                                />
                            </Form>
                        </div>



                        <Divider />
                       
                    </Form>
                );
            default:
                return null;
        }
    };

    const handleSave = async () => {
        const payload: AvailabilityTemplateIntervalCreateDTO = {
            ...record,
            templateId: resource?.id ?? record.templateId,
            dayOfWeek: day,
            slotDurationMinutes: Number(record.slotDurationMinutes)
        };
        await createAvailabilityTemplateInterval(payload).unwrap().then(() => {
            dispatch(notify({ msg: 'Added Successfully', sev: 'success' }));
        }).catch(() => {
            dispatch(notify({ msg: 'Failed to save', sev: 'warning' }));
        })
        setOpen(false);
    };
    


    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Add Interval"
            size="40vw"
            content={conjureFormContent}
            actionButtonLabel="Save"
            actionButtonFunction={handleSave}
        />
    );
};

export default AddIntervalModal;
