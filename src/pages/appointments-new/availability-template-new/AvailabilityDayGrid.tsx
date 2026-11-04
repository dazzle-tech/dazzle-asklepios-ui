import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import MyButton from '@/components/MyButton/MyButton';
import { useGetAvailabilityTemplateIntervalsByTemplateAndDayQuery } from '@/services/appointment/availabilityTemplate/availabilityTemplateInterval';
import type { AvailabilityTemplateIntervalResponseVM } from '@/types/model-types-new';
import AvailabilityIntervalCard from './AvailabilityIntervalCard';
import AvailabilityTemplateSummaryCard from './AvailabilityTemplateSummaryCard';
import AddIntervalModal from './AddIntervalModal';
import './styles.less';

const generateDayTimes = (stepMinutes: number) => {
  const times: { label: string; minutes: number }[] = [];
  for (let m = 0; m < 24 * 60; m += stepMinutes) {
    const h = Math.floor(m / 60).toString().padStart(2, '0');
    const mm = (m % 60).toString().padStart(2, '0');
    times.push({ label: `${h}:${mm}`, minutes: m });
  }
  return times;
};

const DAY_TIMES = generateDayTimes(120);

type TemplateColumnProps = {
  template: any;
  day: string;
  onAddInterval: (template: any) => void;
  onEditTemplate?: (template: any) => void;
  onEditInterval?: (interval: AvailabilityTemplateIntervalResponseVM, template: any) => void;
  readOnly: boolean;
};

const TemplateColumn: React.FC<TemplateColumnProps> = ({ template, day, onAddInterval, onEditTemplate, onEditInterval, readOnly }) => {
  const { data: intervals = [], isFetching } = useGetAvailabilityTemplateIntervalsByTemplateAndDayQuery(
    { templateId: template?.id, dayOfWeek: day },
    { skip: !template?.id || !day }
  );

  const isDayWorking = () => {
    const found = (template?.workingDays ?? []).find((d: any) => d.dayOfWeek === day);
    return found?.isWorking === true;
  };

  const formatSlotLabel = (interval: AvailabilityTemplateIntervalResponseVM) => {
    const minutes = interval?.slotDurationMinutes ?? template?.durationMinutes;
    return minutes != null ? `${minutes} min` : '-';
  };

  return (
    <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <AvailabilityTemplateSummaryCard template={template} onEdit={onEditTemplate} readOnly={readOnly} />

      {isFetching ? (
        <div style={{ padding: '8px 4px' }}>Loading...</div>
      ) : (
        intervals.map(interval => (
          <AvailabilityIntervalCard
            key={interval?.id ?? `${interval?.startTime}-${interval?.endTime}`}
            interval={interval}
            slotLabel={formatSlotLabel(interval)}
            backgroundColor={template?.templateColor ?? '#6982F0'}
            onEdit={() => onEditInterval?.(interval, template)}
            readOnly={readOnly}
          />
        ))
      )}

      {!readOnly && isDayWorking() && (
        <MyButton
          prefixIcon={() => <FaPlus />}
          width="300px"
          appearance="ghost"
          color={template?.templateColor ?? '#6982F0'}
          onClick={() => onAddInterval(template)}
        >
          Add Interval
        </MyButton>
      )}
    </div>
  );
};

type AvailabilityDayGridProps = {
  templates: any;
  parentTemplate: any;
  day: string;
  onEditTemplate?: (template: any) => void;
  readOnly?: boolean;
  dayInclude?: boolean;
};

const AvailabilityDayGrid: React.FC<AvailabilityDayGridProps> = ({ templates, parentTemplate, day, onEditTemplate, readOnly, dayInclude }) => {
  const [openAddInterval, setOpenAddInterval] = useState(false);
  const [resourceToAddInterval, setResourceToAddInterval] = useState<any>({});
  const [intervalToEdit, setIntervalToEdit] = useState<AvailabilityTemplateIntervalResponseVM | null>(null);

  const normalizedTemplates = Array.isArray(templates) ? templates : (templates as any)?.data ?? [];
  const mergedArray = parentTemplate?.id ? [parentTemplate, ...normalizedTemplates] : [];

  return (
    <>
      <div className="calendar-wrapper">
        <div className="time-column">
          <div className="time-header">Time</div>
          {DAY_TIMES.map(t => (
            <div key={t.minutes} className="time-cell">{t.label}</div>
          ))}
        </div>

        <div className="channels-wrapper">
          <div style={{ display: 'flex', padding: '5px' }}>
            {mergedArray.map(t => (
              <TemplateColumn
                key={t?.id}
                template={t}
                day={day}
                onAddInterval={tmpl => {
                  setIntervalToEdit(null);
                  setResourceToAddInterval(tmpl);
                  setOpenAddInterval(true);
                }}
                onEditInterval={(interval, tmpl) => {
                  setIntervalToEdit(interval);
                  setResourceToAddInterval(tmpl);
                  setOpenAddInterval(true);
                }}
                onEditTemplate={onEditTemplate}
                readOnly={readOnly ?? false}
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
        readOnly={readOnly}
      />
    </>
  );
};

export default AvailabilityDayGrid;
