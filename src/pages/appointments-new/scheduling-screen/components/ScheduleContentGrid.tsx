import React from 'react';
import moment from 'moment';
import { Calendar as BigCalendar, Views } from 'react-big-calendar';
import { Button, ButtonGroup, Calendar as RsCalendar, Panel, Text } from 'rsuite';
import { notify } from '@/utils/uiReducerActions';
import TodayAppointmentsList from './TodayAppointmentsList';

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
  rightPanelAppointmentRows: any[];
  todayTimelineRows: any[];
  handleViewAppointment: (appointmentData?: any) => void;
  dispatch: any;
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
  rightPanelAppointmentRows,
  todayTimelineRows,
  handleViewAppointment,
  dispatch
}: Props) => {
  return (
    <div
      className="appointments-content-grid"
      style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12, flex: 1 }}
    >
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
          {...(currentView === 'day' && {
            resources: visibleResources ?? [],
            resourceIdAccessor: 'key',
            resourceTitleAccessor: 'resourceName'
          })}
          formats={formats}
          localizer={localizer}
          events={finalAppointments ?? []}
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
        <Panel bordered className="appointments-mini-panel" style={{ padding: 10, borderRadius: 12, flex: '0 0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
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
            style={{ width: '100%', height: 220, fontSize: 12 }}
          />
        </Panel>

        <TodayAppointmentsList
          selectedDate={rightPanelDate ?? currentCalendarDate}
          todayAppointmentsList={todayAppointmentsList}
          isFetchingTodayAppointments={isFetchingTodayAppointments}
          rightPanelAppointmentRows={rightPanelAppointmentRows}
          todayTimelineRows={todayTimelineRows}
          onViewAppointment={handleViewAppointment}
        />
      </div>
    </div>
  );
};

export default ScheduleContentGrid;
