
import React, { useEffect, useMemo, useState } from 'react';
import { Divider } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import './PreviewCalendar.less';
import AvailabilityTemplateSummaryCard from './AvailabilityTemplateSummaryCard';
import SlotCard from './SlotCard';
import { IoWarning } from "react-icons/io5";
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAvailabilityTemplateIntervalsByTemplateAndDayQuery } from '@/services/appointment/availabilityTemplate/availabilityTemplateInterval';
import type { AvailabilityTemplateIntervalResponseVM, AvailabilityTemplateResponseVM } from '@/types/model-types-new';
import MyTab from '@/components/MyTab';

type Props = {
    open: boolean;
    onClose: () => void;
    templateName?: string;
    step?: number;
    slotsBeforeAfter?: number;
    parentTemplate?: AvailabilityTemplateResponseVM | null;
    templates?: AvailabilityTemplateResponseVM[] | null;
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

const PreviewSlotsModal: React.FC<Props> = ({
    open,
    onClose,
    templateName,
    step,
    parentTemplate,
    templates
}) => {
    const dayOptions = useEnumOptions("DayOfWeek");
    const [activeTab, setActiveTab] = useState<string>('1');

    useEffect(() => {
        if (!dayOptions || dayOptions.length === 0) return;
        if (!activeTab) {
            setActiveTab('1');
        }
    }, [dayOptions, activeTab]);


    const generateDayTimes = (stepMinutes: number) => {
        const times: { label: string; minutes: number }[] = [];
        for (let m = 0; m < 24 * 60; m += stepMinutes) {
            const h = Math.floor(m / 60).toString().padStart(2, '0');
            const mm = (m % 60).toString().padStart(2, '0');
            times.push({ label: `${h}:${mm}`, minutes: m });
        }
        return times;
    };

    const safeStep = typeof step === 'number' && step > 0 ? step : 30;
    
    const times = 
    // useMemo(() =>
         generateDayTimes(120)
    // , [safeStep]);

    const mergedTemplates = useMemo(() => {
        const list: AvailabilityTemplateResponseVM[] = [];
        if (parentTemplate?.id) {
            list.push(parentTemplate);
        }
        if (Array.isArray(templates)) {
            list.push(...templates);
        }
        return list;
    }, [parentTemplate, templates]);

    const displayTemplateName =
        templateName ??
        parentTemplate?.templateName ??
        (parentTemplate as any)?.name ??
        '';

    const activeIndex = Math.max(0, (Number(activeTab || '1') || 1) - 1);
    const selectedDay = dayOptions?.[activeIndex]?.value ?? dayOptions?.[0]?.value;

    const tabData = useMemo(() => {
        return (dayOptions ?? []).map(day => ({
            title: day.label,
            content: <></>
        }));
    }, [dayOptions]);

    return (
        <MyModal
            open={open}
            setOpen={onClose}
            size="md"
            hideActionBtn
            title={
                <div className="preview-title">
                    <Translate>Preview slots</Translate>
                    <span className="preview-title-muted">{displayTemplateName}</span>
                </div>
            }
            content={
                <>
                    <MyTab
                        data={tabData}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
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
                                {mergedTemplates.map(t => (
                                    <TemplateColumn
                                        key={t?.id ?? t?.templateName}
                                        template={t}
                                        day={selectedDay}
                                        fallbackSlotMinutes={safeStep}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            }
        />
    );
};

type TemplateColumnProps = {
    template: AvailabilityTemplateResponseVM;
    day: string | number | null | undefined;
    fallbackSlotMinutes: number;
};

const TemplateColumn: React.FC<TemplateColumnProps> = ({
    template,
    day,
    fallbackSlotMinutes
}) => {
    const dayOfWeek = day == null ? '' : String(day);
    const shouldFetch = Boolean(template?.id) && Boolean(dayOfWeek);
    const { data: intervals = [], isFetching } = useGetAvailabilityTemplateIntervalsByTemplateAndDayQuery(
        { templateId: template?.id, dayOfWeek },
        { skip: !shouldFetch }
    );

    const slotsCapacity =
        template?.parallelCapacityValue != null
            ? String(template.parallelCapacityValue)
            : '-';
    const templateColor = template?.templateColor ?? "#6982F0";

    return (
        <div
            style={{
                width: "320px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
            }}
        >
            <AvailabilityTemplateSummaryCard template={template} />

            {isFetching ? (
                <div style={{ padding: "8px 4px" }}>Loading...</div>
            ) : (
                (intervals ?? []).map((interval: AvailabilityTemplateIntervalResponseVM) => {
                    const slotsList: { displayTime: string }[] = [];
                    const intervalStartMins = timeToMinutes(interval?.startTime ?? '00:00');
                    const intervalEndMins = timeToMinutes(interval?.endTime ?? '00:00');
                    const slotDurationMinutes =
                        interval?.slotDurationMinutes ??
                        template?.durationMinutes ??
                        fallbackSlotMinutes;
                    const totalSlotDuration = slotDurationMinutes;

                    let currentPointer = intervalStartMins;

                    while (currentPointer + totalSlotDuration <= intervalEndMins) {
                        const slotStart = currentPointer;
                        const slotEnd = currentPointer + totalSlotDuration;

                        slotsList.push({
                            displayTime: `${minutesToTime(slotStart)} - ${minutesToTime(slotEnd)}`,
                        });

                        currentPointer = slotEnd;
                    }

                    return (
                        <React.Fragment key={interval?.id ?? `${interval?.startTime}-${interval?.endTime}`}>
                            {slotsList.map((slot, idx) => (
                                <SlotCard
                                    key={idx}
                                    time={slot.displayTime}
                                    slots={slotsCapacity}
                                    status="New"
                                    backgroundColor={templateColor}
                                />
                            ))}
                        </React.Fragment>
                    );
                })
            )}
        </div>
    );
};

export default PreviewSlotsModal;
