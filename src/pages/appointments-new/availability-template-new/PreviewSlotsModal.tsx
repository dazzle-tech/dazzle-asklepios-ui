import React, { useEffect, useMemo, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import './PreviewCalendar.less';
import AvailabilityTemplateSummaryCard from './AvailabilityTemplateSummaryCard';
import SlotCard from './SlotCard';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAvailabilityTemplateIntervalsByTemplateAndDayQuery } from '@/services/appointment/availabilityTemplate/availabilityTemplateInterval';
import {
    useLazyGetAvailabilityTemplateIntervalBreaksByIntervalQuery
} from '@/services/appointment/availabilityTemplate/availabilityTemplateIntervalBreak';
import type {
    AvailabilityTemplateIntervalResponseVM,
    AvailabilityTemplateResponseVM
} from '@/types/model-types-new';
import MyTab from '@/components/MyTab';

type Props = {
    open: boolean;
    onClose: () => void;
    templateName?: string;
    step?: number;
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

const parseHHmm = (v?: string | null) => {
    if (!v) return null;
    const [h, m] = String(v).split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
};

const findOverlappingBreakEnd = (breaks, slotStart, slotEnd) => {
    const overlappingBreakEnds = breaks
        .map((b) => {
            const breakStart = parseHHmm(b?.startTime);
            const breakEnd = parseHHmm(b?.endTime);

            if (breakStart == null || breakEnd == null || breakEnd <= breakStart) return null;

            const isOverlapping = slotStart < breakEnd && slotEnd > breakStart;
            return isOverlapping ? breakEnd : null;
        })
        .filter(Boolean);

    return overlappingBreakEnds.length ? Math.max(...overlappingBreakEnds) : null;
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

    const safeStep = typeof step === 'number' && step > 0 ? step : 30;

    const mergedTemplates = useMemo(() => {
        const list: AvailabilityTemplateResponseVM[] = [];
        if (parentTemplate?.id) list.push(parentTemplate);
        if (Array.isArray(templates)) list.push(...templates);
        return list;
    }, [parentTemplate, templates]);

    const displayTemplateName =
        templateName ??
        parentTemplate?.templateName ??
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
                    <MyTab data={tabData} activeTab={activeTab} setActiveTab={setActiveTab} />

                    <div className="calendar-wrapper">
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

    const { data: intervals = [], isFetching } =
        useGetAvailabilityTemplateIntervalsByTemplateAndDayQuery(
            { templateId: template?.id, dayOfWeek },
            { skip: !template?.id || !dayOfWeek }
        );

    const [loadBreaksByInterval] = useLazyGetAvailabilityTemplateIntervalBreaksByIntervalQuery();
    const [intervalBreaks, setIntervalBreaks] = useState({});

    useEffect(() => {
        const load = async () => {
            const map = {};

            for (const interval of intervals ?? []) {
                const id = interval?.id;
                if (!id) continue;

                try {
                    map[id] = await loadBreaksByInterval({ intervalId: id }).unwrap();
                } catch {
                    map[id] = [];
                }
            }

            setIntervalBreaks(map);
        };

        if (intervals?.length) load();
    }, [intervals]);

    const slotsCapacity =
        template?.parallelCapacityValue != null
            ? String(template.parallelCapacityValue)
            : '-';

    const templateColor = template?.templateColor ?? "#6982F0";

    return (
        <div style={{ width: "320px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <AvailabilityTemplateSummaryCard template={template} />

            {isFetching ? (
                <div>Loading...</div>
            ) : (
                intervals.map((interval: AvailabilityTemplateIntervalResponseVM) => {
                    const slotsList: { displayTime: string; isBreak: boolean }[] = [];

                    const startMins = timeToMinutes(interval?.startTime ?? '00:00');
                    const endMins = timeToMinutes(interval?.endTime ?? '00:00');

                    const slotDuration =
                        interval?.slotDurationMinutes ??
                        template?.durationMinutes ??
                        fallbackSlotMinutes;

                    let cursor = startMins;

                    while (cursor + slotDuration <= endMins) {
                        const slotStart = cursor;
                        const slotEnd = cursor + slotDuration;

                        const breaks = intervalBreaks[interval.id] ?? [];

                        const overlappingBreakEnd = findOverlappingBreakEnd(
                            breaks,
                            slotStart,
                            slotEnd
                        );

                        if (overlappingBreakEnd != null) {
                            cursor = overlappingBreakEnd;
                            continue;
                        }

                        slotsList.push({
                            displayTime: `${minutesToTime(slotStart)} - ${minutesToTime(slotEnd)}`,
                            isBreak: false
                        });

                        cursor = slotEnd;
                    }

                    return (
                        <React.Fragment key={interval?.id}>
                            {slotsList.map((slot, idx) => (
                                <SlotCard
                                    key={idx}
                                    time={slot.displayTime}
                                    slots={slot.isBreak ? '-' : slotsCapacity}
                                    backgroundColor={slot.isBreak ? '#F04438' : templateColor}
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