import React, { useState, useRef } from 'react';
import { Button, Stack, Panel, FlexboxGrid } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import '../MyAppointmentScreen.less';

import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isToday as dfIsToday,
  isSameDay,
  addMonths,
  format
} from 'date-fns';
import clsx from 'clsx';

const AppointmentCalender = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef(null);

  const getMonthDates = (year, month) =>
    eachDayOfInterval({
      start: startOfMonth(new Date(year, month, 1)),
      end: endOfMonth(new Date(year, month, 1))
    });

  const allDates = getMonthDates(currentYear, currentMonth);

  const handlePrevMonth = () => {
    const prev = addMonths(new Date(currentYear, currentMonth, 1), -1);
    setCurrentMonth(prev.getMonth());
    setCurrentYear(prev.getFullYear());
    containerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  const handleNextMonth = () => {
    const next = addMonths(new Date(currentYear, currentMonth, 1), 1);
    setCurrentMonth(next.getMonth());
    setCurrentYear(next.getFullYear());
    containerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  const handleMouseDown = e => {
    setIsDragging(true);
    setStartX(e.clientX);
  };
  const handleMouseMove = e => {
    if (!isDragging) return;
    const c = containerRef.current;
    const walk = (e.clientX - startX) * 12;
    if (c) c.scrollLeft -= walk;
    setStartX(e.clientX);
  };
  const handleMouseUp = () => setIsDragging(false);

  return (
    <Panel bordered className="appointment-container">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        className="appointment-header"
        aria-label="Calendar month navigation"
      >
        <Button onClick={handlePrevMonth} aria-label="Previous month">
          ←
        </Button>
        <span className="month-year-text">
          {format(new Date(currentYear, currentMonth, 1), 'MMMM yyyy')}
        </span>
        <Button onClick={handleNextMonth} aria-label="Next month">
          →
        </Button>
      </Stack>

      {/* Horizontal, scrollable strip */}
      <div
        ref={containerRef}
        className="date-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        role="listbox"
        aria-label="Select a date"
      >
        {allDates.map(date => {
          const selected = isSameDay(date, selectedDate);
          const todayStyle = dfIsToday(date) ? 'is-today' : '';

          return (
            <div key={date.toISOString()} className="date-item">
              <Button
                appearance={selected ? 'primary' : 'default'}
                onClick={() => setSelectedDate(date)}
                className={clsx(
                  'appointment-button',
                  'appointment-circle',
                  selected ? 'selected-date' : 'default-date',
                  todayStyle
                )}
                role="option"
                aria-selected={selected}
                tabIndex={0}
              >
                <span className="daynum-text">{format(date, 'd')}</span>
              </Button>
            </div>
          );
        })}
      </div>

      <Panel shaded bodyFill className="selected-date-display">
        <strong>Selected Date:</strong> {format(selectedDate, 'EEE MMM d yyyy')}
      </Panel>
    </Panel>
  );
};

export default AppointmentCalender;
