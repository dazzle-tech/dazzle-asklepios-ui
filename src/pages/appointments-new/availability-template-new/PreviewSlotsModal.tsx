import React, { useEffect, useMemo, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import './PreviewCalendar.less';
import AvailabilityTemplateSummaryCard from './AvailabilityTemplateSummaryCard';
import SlotCard from './SlotCard';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAvailabilityTemplateIntervalsByTemplateAndDayQuery } from '@/services/appointment/availabilityTemplate/availabilityTemplateInterval';
import { useLazyGetAvailabilityTemplateIntervalBreaksByIntervalQuery } from '@/services/appointment/availabilityTemplate/availabilityTemplateIntervalBreak';
import type {
  AvailabilityTemplateIntervalBreakResponseVM,
  AvailabilityTemplateIntervalResponseVM,
  AvailabilityTemplateResponseVM,
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

const parseHHmm = (v?: string | null) => {
  if (!v) return null;
  const [h, m] = String(v).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const toHHmm = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const findOverlappingBreakEnd = (
  breaks: AvailabilityTemplateIntervalBreakResponseVM[],
  slotStart: number,
  slotEnd: number
) => {
  const overlappingBreakEnds = breaks
    .map((intervalBreak) => {
      const breakStart = parseHHmm(intervalBreak?.startTime as any);
      const breakEnd = parseHHmm(intervalBreak?.endTime as any);

      if (breakStart == null || breakEnd == null || breakEnd <= breakStart) return null;

      const isOverlapping = slotStart < breakEnd && slotEnd > breakStart;
      return isOverlapping ? breakEnd : null;
    })
    .filter((v): v is number => v != null);

  return overlappingBreakEnds.length ? Math.max(...overlappingBreakEnds) : null;
};

type PreviewCard = {
  time: string;
  slots: string;
  backgroundColor: string;
  badgeLabel: string;
  key: string;
};

const PreviewSlotsModal: React.FC<Props> = ({
  open,
  onClose,
  templateName,
  step,
  parentTemplate,
  templates,
}) => {
  const dayOptions = useEnumOptions('DayOfWeek');
  const [activeTab, setActiveTab] = useState<string>('1');

  const safeStep = typeof step === 'number' && step > 0 ? step : 30;

  const mergedTemplates = useMemo(() => {
    const list: AvailabilityTemplateResponseVM[] = [];
    if (parentTemplate?.id) list.push(parentTemplate);
    if (Array.isArray(templates)) list.push(...templates);
    return list;
  }, [parentTemplate, templates]);

  const displayTemplateName = templateName ?? parentTemplate?.templateName ?? '';

  const activeIndex = Math.max(0, (Number(activeTab || '1') || 1) - 1);
  const selectedDay = dayOptions?.[activeIndex]?.value ?? dayOptions?.[0]?.value;

  const tabData = useMemo(
    () =>
      (dayOptions ?? []).map((day) => ({
        title: day.label,
        content: <></>,
      })),
    [dayOptions]
  );

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
              <div style={{ display: 'flex', padding: '5px' }}>
                {mergedTemplates.map((t) => (
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
  fallbackSlotMinutes,
}) => {
  const dayOfWeek = day == null ? '' : String(day);

  const { data: intervals = [], isFetching } =
    useGetAvailabilityTemplateIntervalsByTemplateAndDayQuery(
      { templateId: template?.id, dayOfWeek },
      { skip: !template?.id || !dayOfWeek }
    );

  const [loadBreaksByInterval] = useLazyGetAvailabilityTemplateIntervalBreaksByIntervalQuery();
  const [intervalBreaks, setIntervalBreaks] = useState<
    Record<string, AvailabilityTemplateIntervalBreakResponseVM[]>
  >({});

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const map: Record<string, AvailabilityTemplateIntervalBreakResponseVM[]> = {};

      for (const interval of intervals ?? []) {
        const id = interval?.id;
        if (!id) continue;

        try {
          map[String(id)] = await loadBreaksByInterval({ intervalId: id }).unwrap();
        } catch {
          map[String(id)] = [];
        }
      }

      if (mounted) setIntervalBreaks(map);
    };

    if (intervals?.length) load();
    return () => {
      mounted = false;
    };
  }, [intervals, loadBreaksByInterval]);

  const templateColor = template?.templateColor ?? '#6982F0';
  const slotBeforeMinutes = Math.max(0, Number(template?.defaultBufferBeforeMinutes ?? 0));
  const slotAfterMinutes = Math.max(0, Number(template?.defaultBufferAfterMinutes ?? 0));
  const templateCapacity =
    Number(template?.parallelCapacityValue ?? 1) > 0
      ? Number(template?.parallelCapacityValue ?? 1)
      : 1;

  return (
    <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <AvailabilityTemplateSummaryCard template={template} />

      {isFetching ? (
        <div>Loading...</div>
      ) : (
        intervals.map((interval: AvailabilityTemplateIntervalResponseVM) => {
          const cards: PreviewCard[] = [];
          const startMins = timeToMinutes(interval?.startTime ?? '00:00');
          const endMins = timeToMinutes(interval?.endTime ?? '00:00');
          const slotDuration =
            interval?.slotDurationMinutes ?? template?.durationMinutes ?? fallbackSlotMinutes;
          const breaks = intervalBreaks[String(interval?.id ?? '')] ?? [];

          if (!slotDuration || slotDuration <= 0) {
            return null;
          }

          let cursor = startMins;

          while (cursor + slotDuration <= endMins) {
            const slotStart = cursor;
            const slotEnd = cursor + slotDuration;
            const overlappingBreakEnd = findOverlappingBreakEnd(breaks, slotStart, slotEnd);

            if (overlappingBreakEnd != null) {
              cursor = overlappingBreakEnd + slotBeforeMinutes;
              continue;
            }

            const beforeBufferStart = slotStart - slotBeforeMinutes;
            const beforeBufferEnd = slotStart;
            const afterBufferStart = slotEnd;
            const afterBufferEnd = slotEnd + slotAfterMinutes;

            if (slotBeforeMinutes > 0) {
              cards.push({
                key: `before-${interval?.id}-${slotStart}`,
                time: `${toHHmm(beforeBufferStart)} - ${toHHmm(beforeBufferEnd)}`,
                slots: String(templateCapacity),
                backgroundColor: templateColor,
                badgeLabel: 'buffer',
              });
            }

            cards.push({
              key: `slot-${interval?.id}-${slotStart}`,
              time: `${toHHmm(slotStart)} - ${toHHmm(slotEnd)}`,
              slots: String(templateCapacity),
              backgroundColor: templateColor,
              badgeLabel: 'slots',
            });

            if (slotAfterMinutes > 0) {
              cards.push({
                key: `after-${interval?.id}-${slotEnd}`,
                time: `${toHHmm(afterBufferStart)} - ${toHHmm(afterBufferEnd)}`,
                slots: String(templateCapacity),
                backgroundColor: templateColor,
                badgeLabel: 'buffer',
              });
            }

            cursor = afterBufferEnd + slotBeforeMinutes;
          }

          return (
            <React.Fragment key={interval?.id}>
              {cards.map((card) => (
                <SlotCard
                  key={card.key}
                  time={card.time}
                  slots={card.slots}
                  backgroundColor={card.backgroundColor}
                  badgeLabel={card.badgeLabel}
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
