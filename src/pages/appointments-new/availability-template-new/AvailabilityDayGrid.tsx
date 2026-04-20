import React, { useState } from 'react';
import AvailabilityIntervalCard from './AvailabilityIntervalCard';
import './styles.less';
import AvailabilityTemplateSummaryCard from './AvailabilityTemplateSummaryCard';
import AddIntervalModal from './AddIntervalModal';
import MyButton from '@/components/MyButton/MyButton';
import { FaPlus } from "react-icons/fa";
import { useGetAvailabilityTemplateIntervalsByTemplateAndDayQuery } from '@/services/appointment/availabilityTemplate/availabilityTemplateInterval';
import type { AvailabilityTemplateIntervalResponseVM } from '@/types/model-types-new';
import { PropaneSharp } from '@mui/icons-material';
import { useLazyGetPractitionerByIdQuery } from '@/services/setup/practitioner/PractitionerService';
import { useLazyGetDiagnosticTestByIdQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useLazyGetCatalogByIdQuery } from '@/services/setup/catalog/catalogService';
import { useLazyGetServiceByIdQuery } from '@/services/setup/serviceService';





const generateDayTimes = (step: number) => {
    const times: { label: string; minutes: number }[] = [];
    for (let m = 0; m < 24 * 60; m += step) {
        const h = Math.floor(m / 60).toString().padStart(2, '0');
        const mm = (m % 60).toString().padStart(2, '0');
        times.push({ label: `${h}:${mm}`, minutes: m });
    }
    return times;
};

type TemplateColumnProps = {
    template: any;
    day: string;
    onAddInterval: (template: any) => void;
    onEditTemplate?: (template: any) => void;
    onEditInterval?: (interval: AvailabilityTemplateIntervalResponseVM, template: any) => void;
    readOnly: boolean;
    dayInclude: boolean;
};

const TemplateColumn: React.FC<TemplateColumnProps> = ({
    template,
    day,
    onAddInterval,
    onEditTemplate,
    onEditInterval,
    readOnly,
    dayInclude
}) => {
    const shouldFetch = Boolean(template?.id) && Boolean(day);
    const { data: intervals = [], isFetching } = useGetAvailabilityTemplateIntervalsByTemplateAndDayQuery(
        { templateId: template?.id, dayOfWeek: day },
        { skip: !shouldFetch }
    );

    const formatSlotLabel = (interval: AvailabilityTemplateIntervalResponseVM) => {
        const minutes = interval?.slotDurationMinutes ?? template?.durationMinutes;
        if (minutes == null) return '-';
        return `${minutes} min`;
    };

    const isDayWorking = () => {
    const workingDays = template?.workingDays;
    if (!workingDays || !day) return false;

    const foundDay = workingDays.find(
        (d: any) => d.dayOfWeek === day
    );

    return foundDay?.isWorking === true;
};

    return (
        <div
            key={template?.id}
            style={{
                width: "320px",
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}
        >
            <AvailabilityTemplateSummaryCard
                template={template}
                onEdit={onEditTemplate}
                readOnly={readOnly}
            />

            {isFetching ? (
                <div style={{ padding: "8px 4px" }}>Loading...</div>
            ) : (
                intervals.map(interval => (
                    <AvailabilityIntervalCard
                        key={interval?.id ?? `${interval?.startTime}-${interval?.endTime}`}
                        interval={interval}
                        slotLabel={formatSlotLabel(interval)}
                        backgroundColor={template?.templateColor ?? "#6982F0"}
                        onEdit={() => {
                            if (onEditInterval) {
                                onEditInterval(interval, template);
                            }
                        }}
                        readOnly={readOnly}
                    />
                ))
            )}
            {((!readOnly) && isDayWorking()) && (
                <MyButton
                    prefixIcon={() => <FaPlus />}
                    width="300px"
                    appearance='ghost'
                    color={template?.templateColor ?? "#6982F0"}
                    onClick={() => { onAddInterval(template); }}
                >
                    Add Interval
                </MyButton>
            )}
        </div>
    );
};

const AvailabilityDayGrid = ({
    templates,
    parentTemplate,
    day,
    onEditTemplate,
    ...props
}: {

    templates: any;
    parentTemplate: any;
    day: string;
    onEditTemplate?: (template: any) => void;
    readOnly?: boolean;
    dayInclude?: boolean;
}) => {

    const times =
        // useMemo(() =>
        generateDayTimes(120)
    // , [120]);
    const [openAddInterval, setOpenAddInterval] = useState(false);

    const [resourceToAddInterval, setResourceToAddInterval] = useState({});
    const [intervalToEdit, setIntervalToEdit] = useState<AvailabilityTemplateIntervalResponseVM | null>(null);




    const normalizedTemplates = Array.isArray(templates)
        ? templates
        : (templates as any)?.data ?? [];

    const mergedArray = parentTemplate?.id
  ? [parentTemplate, ...normalizedTemplates]
  : [];

   console.log("mergedArray: ", mergedArray);

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
                                <TemplateColumn
                                    key={t?.id}
                                    template={t}
                                    day={day}
                                    onAddInterval={(template) => {
                                        setIntervalToEdit(null);
                                        setResourceToAddInterval(template);
                                        setOpenAddInterval(true);
                                    }}
                                    onEditInterval={(interval, template) => {
                                        setIntervalToEdit(interval);
                                        setResourceToAddInterval(template);
                                        setOpenAddInterval(true);
                                    }}
                                    onEditTemplate={onEditTemplate}
                                    readOnly={props?.readOnly}
                                    dayInclude={props?.dayInclude}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <AddIntervalModal
                    open={openAddInterval}
                    setOpen={setOpenAddInterval}
                    resource={resourceToAddInterval}
                    day={day}
                    intervalToEdit={intervalToEdit}
                    parentTemplate={parentTemplate}
                    readOnly={props?.readOnly}
                />


            </div>
        </>
    );
};

export default AvailabilityDayGrid;
