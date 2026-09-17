import React from 'react';
import moment from 'moment';
import momentHijri from 'moment-hijri';
import { Calendar as BigCalendar, Views } from 'react-big-calendar';
import {
  Button,
  ButtonGroup,
  Calendar as RsCalendar,
  Panel,
  Text,
  SelectPicker
} from 'rsuite';
import { notify } from '@/utils/uiReducerActions';
import TodayAppointmentsList from './TodayAppointmentsList';
import WaitingListPanel from './WaitingListPanel';
import Translate from '@/components/Translate';


type HijriCalendarProps = {
  value: Date;
  onChange: (date: Date) => void;
};

  const HijriCalendar = ({ value, onChange }: HijriCalendarProps) => {
    const currentHijri = momentHijri(value).locale('en');

        const [viewMonth, setViewMonth] = React.useState(
    momentHijri(value).locale('en').startOf('iMonth')    );

    React.useEffect(() => {
      setViewMonth(
        momentHijri(value).locale('en').startOf('iMonth')
      );
    }, [value]);

    const year = viewMonth.iYear();
    const month = viewMonth.iMonth();

    const daysInMonth = viewMonth.clone().endOf('iMonth').iDate();

    const firstDay = viewMonth.clone().startOf('iMonth').day();

    const days = Array.from({ length: firstDay + daysInMonth }, (_, index) => {
      if (index < firstDay) return null;

      const day = index - firstDay + 1;

      return viewMonth.clone().iDate(day);
    });

const previousMonth = () => {
  setViewMonth(prev =>
    prev.clone().locale('en').subtract(1, 'iMonth')
  );
};

const nextMonth = () => {
  setViewMonth(prev =>
    prev.clone().locale('en').add(1, 'iMonth')
  );
};

    const isSelected = (date: moment.Moment) => {
      return date.format('iYYYY/iMM/iDD') === currentHijri.format('iYYYY/iMM/iDD');
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div
        style={{
          padding: '8px',
          border: '1px solid var(--rs-border-primary)',
          borderRadius: '6px',
          background: 'var(--rs-bg-card)'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}
        >
          <Button
            appearance="subtle"
            size="xs"
            onClick={previousMonth}
          >
            ‹
          </Button>

          <Text strong>
            {viewMonth.format('iMMMM iYYYY')}
          </Text>

          <Button
            appearance="subtle"
            size="xs"
            onClick={nextMonth}
          >
            ›
          </Button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 2,
            marginBottom: 4
          }}
        >
          {weekDays.map(day => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 0',
                opacity: 0.7
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 2
          }}
        >
          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} />;
            }

            const selected = isSelected(day);

            return (
              <Button
                key={day.format('iYYYY-iMM-iDD')}
                appearance={selected ? 'primary' : 'subtle'}
                size="xs"
                onClick={() => {
                  const gregorianDate = day.toDate();

                  onChange(gregorianDate);
                }}
                style={{
                  minWidth: 0,
                  width: '100%',
                  height: 30,
                  padding: 0
                }}
              >
                {day.locale('en').format('iD')}
              </Button>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid var(--rs-border-primary)',
            textAlign: 'center'
          }}
        >
          <Text muted style={{ fontSize: 12 }}>
            {currentHijri.locale('en').format('iDD/iMM/iYYYY')}
          </Text>
        </div>
      </div>
    );
  };

type Props = {
  calendarKey: string;
  currentCalendarDate: Date;
  setCalendarDate: (date: Date) => void;
  setCurrentCalendarDate: (date: Date) => void;
  setRightPanelDate: (date: Date) => void;
  currentView: string;
  visibleResources: any[];
  minTime: Date;
  formats: any;
  localizer: any;
  finalAppointments: any[];
  resourcesWithAvailabilityResponse: any;
  setSelectedSlot: (slot: any) => void;
  setBookPatientReadOnly: (value: boolean) => void;
  setBookPatientModalOpen: (value: boolean) => void;
  handleSelectEvent: (event: any) => void;
  getTooltipContent: (event: any) => string;
  setCurrentView: (view: any) => void;
  eventPropGetter: (event: any) => any;
  ResourceHeader: ({ resource }: any) => JSX.Element;
  MyEvent: ({ event }: any) => JSX.Element;
  slotPropGetter: (date: Date, resourceId: any) => any;
  rightPanelDate: Date;
  todayAppointmentsList: any[];
  isFetchingTodayAppointments: boolean;
  isSearchingAppointments?: boolean;
  rightPanelAppointmentRows: any[];
  todayTimelineRows: any[];
  handleViewAppointment: (appointmentData?: any) => void;
  dispatch: any;
  facilityId?: number | string | null;
  waitingListDepartmentId?: number | null;
  departmentOptions?: any[];
  onWaitingListBooked?: () => void | Promise<void>;
  dateType: 'GREGORIAN' | 'HIJRI';
  setDateType: (type: 'GREGORIAN' | 'HIJRI') => void;
};

const ScheduleContentGrid = ({
  calendarKey,
  currentCalendarDate,
  setCalendarDate,
  setCurrentCalendarDate,
  setRightPanelDate,
  currentView,
  visibleResources,
  minTime,
  formats,
  localizer,
  finalAppointments,
  resourcesWithAvailabilityResponse,
  setSelectedSlot,
  setBookPatientReadOnly,
  setBookPatientModalOpen,
  handleSelectEvent,
  getTooltipContent,
  setCurrentView,
  eventPropGetter,
  ResourceHeader,
  MyEvent,
  slotPropGetter,
  rightPanelDate,
  todayAppointmentsList,
  isFetchingTodayAppointments,
  isSearchingAppointments = false,
  rightPanelAppointmentRows,
  todayTimelineRows,
  handleViewAppointment,
  dispatch,
  facilityId,
  waitingListDepartmentId,
  departmentOptions,
  dateType,
  setDateType,
  onWaitingListBooked
}: Props) => {
  const calendarEvents = React.useMemo(() => {
    return finalAppointments ?? [];
  }, [finalAppointments]);

  const dayViewResources = React.useMemo(() => {
    if (currentView !== 'day') return visibleResources ?? [];

    const resourcesByKey = new Map<string, any>();

    (visibleResources ?? []).forEach((resource: any) => {
      const key = String(resource?.key ?? resource?.resourceId ?? '').trim();
      if (!key) return;
      resourcesByKey.set(key, {
        ...resource,
        key,
        resourceId: key,
        resourceName: <Translate>{String(resource?.resourceName ?? resource?.name ?? `Resource ${key}`)}</Translate>
      });
    });

    (finalAppointments ?? []).forEach((appt: any) => {
      const key = String(
        appt?.resourceId ?? appt?.filterResourceId ?? appt?.appointmentData?.resourceId ?? appt?.appointmentData?.departmentId ?? ''
      ).trim();
      if (!key || resourcesByKey.has(key)) return;
      const name = String(
        appt?.tooltipResourceName ??
        appt?.appointmentData?.resourceName ??
        appt?.appointmentData?.departmentName ??
        appt?.appointmentData?.resource?.resourceName ??
        appt?.appointmentData?.resource?.name ??
        `Resource ${key}`
      ).trim();
      resourcesByKey.set(key, { key, resourceName: name });
    });

    return Array.from(resourcesByKey.values());
  }, [currentView, visibleResources, finalAppointments]);

  const maxTime = React.useMemo(() => {
    const candidateEndMinutes: number[] = [];
    (calendarEvents ?? []).forEach((evt: any) => {
      const end = new Date(evt?.end);
      if (!Number.isNaN(end.getTime())) {
        candidateEndMinutes.push(end.getHours() * 60 + end.getMinutes());
      }
    });

    const fallbackEnd = 23 * 60;
    const latest = candidateEndMinutes.length > 0 ? Math.max(...candidateEndMinutes) : fallbackEnd;
    const roundedEnd = Math.min(24 * 60 - 1, Math.ceil(latest / 60) * 60);
    const value = new Date();
    value.setHours(Math.floor(roundedEnd / 60), roundedEnd % 60, 0, 0);
    return value;
  }, [calendarEvents]);

  const isLoading = isSearchingAppointments || isFetchingTodayAppointments;

  return (
    <div
      className="appointments-content-grid"
      style={{ display: 'grid', gridTemplateColumns: '1fr minmax(300px, 320px)', gap: 12, flex: 1, position: 'relative' }}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(2px)',
            borderRadius: '4px'
          }}
        >
          <Panel
            style={{
              padding: '30px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              borderRadius: '8px'
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #f0f0f0',
                  borderTop: '4px solid #0284c7',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto',
                }}
              />
            </div>
            <Text strong style={{ fontSize: '14px', color: '#333' }}>
              Loading appointments...
            </Text>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </Panel>
        </div>
      )}
      <div
        className="appointments-calendar-pane"
        style={{ minHeight: 0, height: '100%', overflowX: 'auto', overflowY: 'hidden' }}
      >
        <BigCalendar
          key={calendarKey}
          toolbar={false}
          date={currentCalendarDate}
          onNavigate={date => {
            setCalendarDate(date);
            setCurrentCalendarDate(date);
            setRightPanelDate(date);
          }}
          className={`my-calendar ${currentView}`}
          style={{
            height: currentView === 'day' || currentView === 'week' ? 'max-content' : '100%',
            minWidth:
              currentView === 'day' || currentView === 'week'
                ? `${Math.max((visibleResources?.length || 1) * 300, 900)}px`
                : '100%'
          }}
          min={minTime}
          max={maxTime}
          showMultiDayTimes
          {...(currentView === 'day' && {
            resources: dayViewResources ?? [],
            resourceIdAccessor: 'resourceId',
            resourceTitleAccessor: 'resourceName'
          })}
          formats={formats}
          localizer={localizer}
          events={calendarEvents ?? []}
          step={60}
          timeslots={1}
          onSelectSlot={slotInfo => {
            if (moment(slotInfo.start).startOf('day').isBefore(moment().startOf('day'))) {
              dispatch(
                notify({
                  msg: 'Previous days: available slots cannot be booked.',
                  sev: 'warning'
                })
              );
              return;
            }
            if (slotInfo.resourceId) {
              const currentResource = resourcesWithAvailabilityResponse?.object.find(
                (r: any) => r.key === slotInfo.resourceId
              );

              if (currentResource && currentResource.availability) {
                const jsDay = slotInfo.start.getDay();
                const apiDay = jsDay;
                const currentMinutes = slotInfo.start.getHours() * 60 + slotInfo.start.getMinutes();

                const isAvailable =
                  currentResource?.availability?.some((period: any) => {
                    const startMinutes = period.startHour * 60 + (period.startMinute || 0);
                    const endMinutes = period.endHour * 60 + (period.endMinute || 0);

                    return (
                      period.dayOfWeek === apiDay &&
                      currentMinutes >= startMinutes &&
                      currentMinutes < endMinutes
                    );
                  }) || false;

                if (!isAvailable) {
                  return;
                }

                const enhancedSlotInfo = {
                  ...slotInfo,
                  resourceKey: currentResource.resourceKey,
                  resourceTypeLkey: currentResource.resourceTypeLkey,
                  resourceName: currentResource.resourceName,
                  facilityKey: currentResource.facilityKey
                };
                setSelectedSlot(enhancedSlotInfo);
                setBookPatientReadOnly(false);
                setBookPatientModalOpen(true);
                return;
              }
            }
            return;
          }}
          startAccessor="start"
          endAccessor="end"
          views={['month', 'week', 'day', 'agenda']}
          defaultView={currentView}
          selectable={true}
          onSelectEvent={event => {
            handleSelectEvent(event);
          }}
          tooltipAccessor={event => getTooltipContent(event)}
          onView={view => setCurrentView(view)}
          eventPropGetter={eventPropGetter}
          components={{
            resourceHeader: ResourceHeader,
            event: MyEvent
          }}
          slotPropGetter={currentView == 'day' ? slotPropGetter : null}
        />
      </div>

      <div
        className="appointments-right-pane"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          height: '100%',
          minHeight: 0
        }}
      >
        <div className="appointments-mini-panel">
          <div className="appointments-mini-panel__view-toggle">
            <ButtonGroup
              style={{ borderRadius: '5px', backgroundColor: 'var(--rs-border-primary)' }}
              size="xs"
            >
              <Button
                className="btn-scheduling"
                style={{ border: 'none', height: '30px' }}
                appearance={currentView === Views.WEEK ? 'primary' : 'subtle'}
                onClick={() => setCurrentView(Views.WEEK)}
              >
                <Text>Week</Text>
              </Button>
              <Button
                className="btn-scheduling"
                style={{ border: 'none', height: '30px' }}
                appearance={currentView === Views.DAY ? 'primary' : 'subtle'}
                onClick={() => setCurrentView(Views.DAY)}
              >
                <Text>Day</Text>
              </Button>
              <Button
                className="btn-scheduling"
                style={{ border: 'none', height: '30px' }}
                appearance={currentView === Views.MONTH ? 'primary' : 'subtle'}
                onClick={() => setCurrentView(Views.MONTH)}
              >
                <Text>Month</Text>
              </Button>
              <Button
                className="btn-scheduling"
                style={{ border: 'none', height: '30px' }}
                appearance={currentView === Views.AGENDA ? 'primary' : 'subtle'}
                onClick={() => setCurrentView(Views.AGENDA)}
              >
                <Text>Agenda</Text>
              </Button>
            </ButtonGroup>
          </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              <SelectPicker
                cleanable={false}
                searchable={false}
                value={dateType}
                data={[
                  {
                    label: 'Gregorian',
                    value: 'GREGORIAN'
                  },
                  {
                    label: 'Hijri',
                    value: 'HIJRI'
                  }
                ]}
                onChange={(value: 'GREGORIAN' | 'HIJRI' | null) => {
                  if (!value) return;

                  setDateType(value);
                }}
                style={{ width: '100%' }}
                placeholder="Date Type"
              />

              {dateType === 'GREGORIAN' ? (
                <RsCalendar
                  value={rightPanelDate}
                  onChange={(d: Date | null) => {
                    if (d) {
                      setRightPanelDate(d);
                      setCurrentCalendarDate(d);
                      setCalendarDate(d);
                    }
                  }}
                  compact
                  className="appointments-sidebar-calendar"
                />
              ) : (
              <HijriCalendar
                value={rightPanelDate}
                onChange={(d: Date) => {
                  setRightPanelDate(d);
                  setCurrentCalendarDate(d);
                  setCalendarDate(d);
                }}
              />
              )}

            </div>
        </div>

        <TodayAppointmentsList
          selectedDate={rightPanelDate ?? currentCalendarDate}
          todayAppointmentsList={todayAppointmentsList}
          isFetchingTodayAppointments={isFetchingTodayAppointments}
          rightPanelAppointmentRows={rightPanelAppointmentRows}
          todayTimelineRows={todayTimelineRows}
          onViewAppointment={handleViewAppointment}
        />

        <WaitingListPanel
          facilityId={facilityId}
          departmentId={waitingListDepartmentId}
          departmentOptions={departmentOptions}
          onBooked={onWaitingListBooked}
        />
      </div>
    </div>
  );
};

export default ScheduleContentGrid;
