import React, { useEffect, useState } from 'react';
import { Tabs } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import './PreviewCalendar.less';


type Channel = {
  id: string;
  name: string;
  color?: string;
};

type Interval = {
  id: string;
  start: number;
  end: number;
  type?: 'NORMAL' | 'POOL';
  meta?: {
    name?: string;
    capacity?: number;
    slotsBefore?: number;
  };
};

type ChannelAvailability = {
  channelId: string;
  intervals: Interval[];
};

type AvailabilityByDay = {
  [dayIndex: number]: ChannelAvailability[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  templateName: string;
  step: number;
  channelsByDay: { [dayIndex: number]: Channel[] };
  availability: AvailabilityByDay;
};


const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

const formatMinutes = (m: number) => {
  const h = Math.floor(m / 60).toString().padStart(2, '0');
  const mm = (m % 60).toString().padStart(2, '0');
  return `${h}:${mm}`;
};


const PreviewAvailabilityCalendar: React.FC<Props> = ({
  open,
  onClose,
  templateName,
  step,
  channelsByDay,
  availability
}) => {
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    const availableDays = Object.keys(availability).map(Number);
    if (availableDays.length) setActiveDay(availableDays[0]);
  }, [availability]);

  if (!open) return null;

  const hourHeight = 64;
  const dayChannels = channelsByDay[activeDay] ?? [];
  const dayData = availability[activeDay] ?? [];

  return (
    <MyModal
      open={open}
      setOpen={onClose}
      size="full"
      hideActionBtn
      title={
        <div className="preview-title">
          <Translate>Preview Availability</Translate>
          <span className="preview-title-muted">{templateName}</span>
        </div>
      }
      content={
        <>
          <Tabs activeKey={activeDay} onSelect={k => setActiveDay(Number(k))}>
            {days.map((d, i) => (
              <Tabs.Tab key={i} eventKey={i} title={<Translate>{d}</Translate>} />
            ))}
          </Tabs>

          <div className="calendar-modern">
            <div className="calendar-time">
              <div className="time-header-label">Time</div>
              {Array.from({ length: 24 }).map((_, h) => (
                <div
                  key={h}
                  className="time-label"
                  style={{ height: hourHeight }}
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            <div className="calendar-columns">
              {dayChannels.map(channel => {
                const data = dayData.find(d => d.channelId === channel.id);
                const pool = data?.intervals.find(i => i.type === 'POOL');
                const normals =
                  data?.intervals.filter(i => i.type === 'NORMAL') ?? [];

                return (
                  <div key={channel.id} className="calendar-column">
                    <div
                      className="column-header"
                      style={{ borderColor: channel.color }}
                    >
                      {channel.name}
                    </div>

                    <div className="column-body">
                      {pool && (
                        <div
                          className="pool-card"
                          style={{
                            top: (pool.start / 60) * hourHeight,
                            height:
                              ((pool.end - pool.start) / 60) * hourHeight
                          }}
                        >
                          <div
                            className="pool-card-header"
                            style={{ background: channel.color }}
                          >
                            {pool.meta?.name ?? 'Department Pool'}
                          </div>

                          <div className="pool-card-body">
                            <div className="pool-row">
                              <span>Type</span>
                              <strong>Department Pool</strong>
                            </div>
                            <div className="pool-row">
                              <span>Capacity</span>
                              <strong>
                                {pool.meta?.capacity ?? 1} concurrent
                              </strong>
                            </div>
                            <div className="pool-row">
                              <span>Step</span>
                              <strong>{step} mins</strong>
                            </div>
                            <div className="pool-row">
                              <span>Slots before</span>
                              <strong>
                                {pool.meta?.slotsBefore ?? 0} mins
                              </strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {normals.flatMap(interval => {
                        const slots: JSX.Element[] = [];

                        for (let m = interval.start; m < interval.end; m += step) {
                          slots.push(
                            <div
                              key={`${interval.id}-${m}`}
                              className="slot-card-modern"
                              style={{
                                top: (m / 60) * hourHeight,
                                height: hourHeight - 10,
                                borderColor: channel.color
                              }}
                            >
                              <div className="slot-row">
                                <div className="slot-time">
                                  {formatMinutes(m)} – {formatMinutes(m + step)}
                                </div>

                                <div
                                  className="slot-capacity"
                                  style={{ background: channel.color }}
                                >
                                  {interval.meta?.capacity ?? 1} Slot
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return slots;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      }
    />
  );
};

export default PreviewAvailabilityCalendar;
