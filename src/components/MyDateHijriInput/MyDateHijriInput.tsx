import React, {
  useEffect,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import {
  Form
} from 'rsuite';
import { useSelector } from 'react-redux';
import clsx from 'clsx';
import dayjs from 'dayjs';
import momentHijri from 'moment-hijri';
import { MdCalendarToday } from 'react-icons/md';

import MyLabel from '../MyLabel';
import Translate from '../Translate';
import { useAppDispatch } from '@/hooks';
import { fromCamelCaseToDBName } from '@/utils';
import { notify } from '@/utils/uiReducerActions';

type CalendarType = 'GREGORIAN' | 'HIJRI';

type CalendarBaseProps = {
  value: Date;
  onChange: (date: Date) => void;
  isDateDisabled?: (date: Date) => boolean;
};

const GregorianCalendar = ({
  value,
  onChange,
  isDateDisabled
}: CalendarBaseProps) => {
  const [viewMonth, setViewMonth] =
    useState<Date>(() => {
      const date = new Date(value);

      return new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      );
    });

  useEffect(() => {
    const date = new Date(value);

    setViewMonth(
      new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      )
    );
  }, [value]);

  const daysInMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDay = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth(),
    1
  ).getDay();

  const days = Array.from(
    {
      length: firstDay + daysInMonth
    },
    (_, index) => {
      if (index < firstDay) {
        return null;
      }

      const day =
        index - firstDay + 1;

      return new Date(
        viewMonth.getFullYear(),
        viewMonth.getMonth(),
        day
      );
    }
  );

  const previousMonth = () => {
    setViewMonth(prev =>
      new Date(
        prev.getFullYear(),
        prev.getMonth() - 1,
        1
      )
    );
  };

  const nextMonth = () => {
    setViewMonth(prev =>
      new Date(
        prev.getFullYear(),
        prev.getMonth() + 1,
        1
      )
    );
  };

  const isSelected = (date: Date) => {
    const selected = new Date(value);

    return (
      date.getFullYear() ===
        selected.getFullYear() &&
      date.getMonth() ===
        selected.getMonth() &&
      date.getDate() ===
        selected.getDate()
    );
  };

  const monthName = dayjs(
    viewMonth
  ).format('MMMM YYYY');

  const weekDays = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat'
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10
        }}
      >
        <button
          type="button"
          onClick={previousMonth}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 20,
            width: 32,
            height: 32
          }}
        >
          ‹
        </button>

        <strong
          style={{
            fontSize: 14
          }}
        >
          {monthName}
        </strong>

        <button
          type="button"
          onClick={nextMonth}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 20,
            width: 32,
            height: 32
          }}
        >
          ›
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(7, 1fr)',
          gap: 2,
          marginBottom: 4
        }}
      >
        {weekDays.map(day => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 0',
              opacity: 0.7
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(7, 1fr)',
          gap: 2
        }}
      >
        {days.map((day, index) => {
          if (!day) {
            return (
              <div
                key={`empty-${index}`}
              />
            );
          }

          const selected =
            isSelected(day);

          const disabled =
            isDateDisabled?.(day) ??
            false;

          return (
            <button
              type="button"
              key={day.toISOString()}
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                onChange(day);
              }}
              style={{
                minWidth: 0,
                width: '100%',
                height: 30,
                padding: 0,
                border: 'none',
                borderRadius: 4,
                cursor: disabled
                  ? 'not-allowed'
                  : 'pointer',
                opacity: disabled
                  ? 0.4
                  : 1,
                background: selected
                  ? 'var(--rs-primary-500)'
                  : 'transparent',
                color: selected
                  ? '#fff'
                  : 'inherit'
              }}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};


const HijriCalendar = ({
  value,
  onChange,
  isDateDisabled
}: CalendarBaseProps) => {
  const currentHijri =
    momentHijri(value).locale('en');

  const [viewMonth, setViewMonth] =
    useState(
      momentHijri(value)
        .locale('en')
        .startOf('iMonth')
    );

  useEffect(() => {
    setViewMonth(
      momentHijri(value)
        .locale('en')
        .startOf('iMonth')
    );
  }, [value]);

  const daysInMonth =
    viewMonth
      .clone()
      .endOf('iMonth')
      .iDate();

  const firstDay =
    viewMonth
      .clone()
      .startOf('iMonth')
      .day();

  const days = Array.from(
    {
      length:
        firstDay + daysInMonth
    },
    (_, index) => {
      if (index < firstDay) {
        return null;
      }

      const day =
        index - firstDay + 1;

      return viewMonth
        .clone()
        .iDate(day);
    }
  );

  const previousMonth = () => {
    setViewMonth(prev =>
      prev
        .clone()
        .locale('en')
        .subtract(1, 'iMonth')
    );
  };

  const nextMonth = () => {
    setViewMonth(prev =>
      prev
        .clone()
        .locale('en')
        .add(1, 'iMonth')
    );
  };

  const isSelected = (date: any) => {
    return (
      date.format(
        'iYYYY/iMM/iDD'
      ) ===
      currentHijri.format(
        'iYYYY/iMM/iDD'
      )
    );
  };

  const weekDays = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat'
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'space-between',
          marginBottom: 10
        }}
      >
        <button
          type="button"
          onClick={
            previousMonth
          }
          style={{
            border: 'none',
            background:
              'transparent',
            cursor: 'pointer',
            fontSize: 20,
            width: 32,
            height: 32
          }}
        >
          ‹
        </button>

        <strong
          style={{
            fontSize: 14
          }}
        >
          {viewMonth.format(
            'iMMMM iYYYY'
          )}
        </strong>

        <button
          type="button"
          onClick={nextMonth}
          style={{
            border: 'none',
            background:
              'transparent',
            cursor: 'pointer',
            fontSize: 20,
            width: 32,
            height: 32
          }}
        >
          ›
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(7, 1fr)',
          gap: 2,
          marginBottom: 4
        }}
      >
        {weekDays.map(day => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 0',
              opacity: 0.7
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(7, 1fr)',
          gap: 2
        }}
      >
        {days.map(
          (day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                />
              );
            }

            const selected =
              isSelected(day);

            const disabled =
              isDateDisabled?.(
                day.toDate()
              ) ?? false;

            return (
              <button
                type="button"
                key={day.format(
                  'iYYYY-iMM-iDD'
                )}
                disabled={disabled}
                onClick={() => {
                  if (disabled) {
                    return;
                  }

                  onChange(
                    day.toDate()
                  );
                }}
                style={{
                  minWidth: 0,
                  width: '100%',
                  height: 30,
                  padding: 0,
                  border: 'none',
                  borderRadius: 4,
                  cursor: disabled
                    ? 'not-allowed'
                    : 'pointer',
                  opacity: disabled
                    ? 0.4
                    : 1,
                  background: selected
                    ? 'var(--rs-primary-500)'
                    : 'transparent',
                  color: selected
                    ? '#fff'
                    : 'inherit'
                }}
              >
                {day
                  .locale('en')
                  .format('iD')}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
};


type MyDateHijriInputProps = {
  fieldName: string;
  fieldType?: 'date';

  record: any;
  setRecord?: (record: any) => void;

  vr?: any;

  showLabel?: boolean;
  className?: string;

  width?: number | string;
  height?: number;

  fieldLabel?:
    | string
    | React.ReactNode;

  required?: boolean;
  column?: boolean;

  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;

  placement?: any;

  minDate?: Date;
  maxDate?: Date;

  disablePastDates?: boolean;
  disableFutureDates?: boolean;

  showWarningIfBeforeYear1900?: boolean;
  showWarningIfInPast?: boolean;

  inputColor?: string;

  onBlur?: (e?: any) => void;
};

const MyDateHijriInput = ({
  fieldName,
  fieldType = 'date',
  record,
  setRecord,
  vr,

  showLabel = true,
  className = '',

  width = 145,
  height = 30,

  fieldLabel,
  required,
  column,

  disabled = false,
  readOnly = false,
  placeholder,

  placement,

  minDate,
  maxDate,

  disablePastDates,
  disableFutureDates,

  showWarningIfBeforeYear1900,
  showWarningIfInPast,

  inputColor,

  onBlur
}: MyDateHijriInputProps) => {
  const dispatch =
    useAppDispatch();

  const mode = useSelector(
    (state: any) =>
      state.ui.mode
  );

  const pickerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [calendarType, setCalendarType] =
    useState<CalendarType>(
      'GREGORIAN'
    );

  const [
    isCalendarOpen,
    setIsCalendarOpen
  ] = useState(false);

  const [dateText, setDateText] =
    useState('');

  const [
    validationResult,
    setValidationResult
  ] = useState<
    any[] | undefined
  >(undefined);

  const [
    calendarPosition,
    setCalendarPosition
  ] = useState({
    top: 0,
    left: 0
  });

  const popupWidth = 300;
  const popupHeight = 390;

  const normalizeDigits = (
    value: string
  ) =>
    value
      .replace(
        /[٠-٩]/g,
        d =>
          String(
            '٠١٢٣٤٥٦٧٨٩'.indexOf(
              d
            )
          )
      )
      .replace(
        /[۰-۹]/g,
        d =>
          String(
            '۰۱۲۳۴۵۶۷۸۹'.indexOf(
              d
            )
          )
      );

  const getGregorianDate = (
    value: any
  ): Date | null => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null;
    }

    const normalized =
      normalizeDigits(
        String(value)
      ).trim();

    const match =
      normalized.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    if (!match) {
      return null;
    }

    const [, year, month, day] =
      match;

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }

    if (
      date.getFullYear() !==
        Number(year) ||
      date.getMonth() !==
        Number(month) - 1 ||
      date.getDate() !==
        Number(day)
    ) {
      return null;
    }

    date.setHours(
      0,
      0,
      0,
      0
    );

    return date;
  };

  const formatDisplayDate = (
    value: any,
    type: CalendarType
  ) => {
    const date =
      getGregorianDate(value);

    if (!date) {
      return '';
    }

    if (type === 'HIJRI') {
      return normalizeDigits(
        momentHijri(date)
          .locale('en')
          .format(
            'iDD-iMM-iYYYY'
          )
      );
    }

    return normalizeDigits(
      dayjs(date).format(
        'DD-MM-YYYY'
      )
    );
  };

  const parseTextDate = (
    value: string,
    type: CalendarType
  ): Date | null => {
    const normalized =
      normalizeDigits(
        value
      ).trim();

    const match =
      normalized.match(
        /^(\d{2})-(\d{2})-(\d{4})$/
      );

    if (!match) {
      return null;
    }

    const [, day, month, year] =
      match;

    if (type === 'HIJRI') {
      const hijriDate =
        momentHijri(
          normalized,
          'iDD-iMM-iYYYY',
          true
        ).locale('en');

      if (
        !hijriDate.isValid()
      ) {
        return null;
      }

      return hijriDate.toDate();
    }

    const parsed =
      new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
      );

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return null;
    }

    if (
      parsed.getFullYear() !==
        Number(year) ||
      parsed.getMonth() !==
        Number(month) - 1 ||
      parsed.getDate() !==
        Number(day)
    ) {
      return null;
    }

    parsed.setHours(
      0,
      0,
      0,
      0
    );

    return parsed;
  };

  const commitDate = (
    date: Date | null
  ) => {
    if (!setRecord) {
      return;
    }

    if (!date) {
      setRecord({
        ...record,
        [fieldName]: null
      });

      setDateText('');
      return;
    }

    date.setHours(
      0,
      0,
      0,
      0
    );

    const backendValue =
      normalizeDigits(
        dayjs(date).format(
          'YYYY-MM-DD'
        )
      );

    setRecord({
      ...record,
      [fieldName]:
        backendValue
    });

    setDateText(
      formatDisplayDate(
        backendValue,
        calendarType
      )
    );
  };

  useEffect(() => {
    const fieldDbName =
      fromCamelCaseToDBName(
        fieldName
      );

    if (
      vr?.details?.[
        fieldDbName
      ]
    ) {
      setValidationResult([
        ...vr.details[fieldDbName]
      ]);
    } else {
      setValidationResult(
        undefined
      );
    }
  }, [
    vr,
    fieldName
  ]);

  useEffect(() => {
    setDateText(
      formatDisplayDate(
        record?.[fieldName],
        calendarType
      )
    );
  }, [
    record?.[fieldName],
    calendarType
  ]);


  const isDateDisabled = (
    date: Date
  ) => {
    const currentDate =
      new Date(date);

    currentDate.setHours(
      0,
      0,
      0,
      0
    );

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const minYearDate =
      new Date(
        1900,
        0,
        1
      );

    minYearDate.setHours(
      0,
      0,
      0,
      0
    );

    if (
      currentDate <
      minYearDate
    ) {
      return true;
    }

    if (minDate) {
      const minimum =
        new Date(minDate);

      minimum.setHours(
        0,
        0,
        0,
        0
      );

      if (
        currentDate <
        minimum
      ) {
        return true;
      }
    }

    if (maxDate) {
      const maximum =
        new Date(maxDate);

      maximum.setHours(
        0,
        0,
        0,
        0
      );

      if (
        currentDate >
        maximum
      ) {
        return true;
      }
    }

    if (
      disablePastDates &&
      currentDate <
        today
    ) {
      return true;
    }

    if (
      disableFutureDates &&
      currentDate >
        today
    ) {
      return true;
    }

    return false;
  };


  const calculateCalendarPosition =
    () => {
      const rect =
        pickerRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      let left =
        rect.left;

      let top =
        rect.bottom + 4;

      if (
        left +
          popupWidth +
          8 >
        window.innerWidth
      ) {
        left =
          window.innerWidth -
          popupWidth -
          8;
      }

      left = Math.max(
        8,
        left
      );

      const spaceBelow =
        window.innerHeight -
        rect.bottom -
        8;

      const spaceAbove =
        rect.top - 8;

      if (
        spaceBelow <
          popupHeight &&
        spaceAbove >
          spaceBelow
      ) {
        top =
          rect.top -
          popupHeight -
          4;
      }

      top = Math.max(
        8,
        top
      );

      setCalendarPosition({
        top,
        left
      });
    };

  const openCalendar = () => {
    if (
      disabled ||
      readOnly
    ) {
      return;
    }

    const currentDate =
      getGregorianDate(
        record?.[fieldName]
      ) ?? new Date();

    calculateCalendarPosition();

    if (
      calendarType ===
      'GREGORIAN'
    ) {
      // Gregorian calendar uses current record value.
    }

    setIsCalendarOpen(true);
    setDateText(
      formatDisplayDate(
        record?.[fieldName],
        calendarType
      )
    );

    // Keep selected/current date available to both calendars.
    void currentDate;
  };

  useEffect(() => {
    if (!isCalendarOpen) {
      return;
    }

    const handleMouseDown =
      (event: MouseEvent) => {
        const target =
          event.target as Element | null;

        if (!target) {
          return;
        }

        if (
          pickerRef.current?.contains(
            target
          )
        ) {
          return;
        }

        if (
          target.closest?.(
            '.my-date-hijri-calendar-popup'
          )
        ) {
          return;
        }

        setIsCalendarOpen(false);
      };

    const handleResize = () => {
      calculateCalendarPosition();
    };

    const timer =
      window.setTimeout(() => {
        document.addEventListener(
          'mousedown',
          handleMouseDown,
          true
        );
      }, 0);

    window.addEventListener(
      'resize',
      handleResize
    );

    window.addEventListener(
      'scroll',
      handleResize,
      true
    );

    return () => {
      window.clearTimeout(
        timer
      );

      document.removeEventListener(
        'mousedown',
        handleMouseDown,
        true
      );

      window.removeEventListener(
        'resize',
        handleResize
      );

      window.removeEventListener(
        'scroll',
        handleResize,
        true
      );
    };
  }, [
    isCalendarOpen
  ]);


  const handleCalendarTypeChange =
    (
      type: CalendarType
    ) => {
      setCalendarType(
        type
      );

      setDateText(
        formatDisplayDate(
          record?.[fieldName],
          type
        )
      );
    };

  const currentDate =
    getGregorianDate(
      record?.[fieldName]
    ) ?? new Date();


  const fieldDisplayLabel =
    fieldLabel ??
    fieldName;



  return (
    <Form.Group
      className={clsx(
        `my-input-container ${className} ${
          mode === 'light'
            ? 'light'
            : 'dark'
        }`
      )}
    >
      <Form.ControlLabel>
        {showLabel && (
          <MyLabel
            label={
              typeof fieldDisplayLabel ===
              'string' ? (
                <Translate>
                  {
                    fieldDisplayLabel
                  }
                </Translate>
              ) : (
                fieldDisplayLabel
              )
            }
            error={
              validationResult
            }
            color={
              mode === 'light'
                ? 'var(--black)'
                : 'var(--white)'
            }
          />
        )}

        {required && (
          <span className="required-field">
            *
          </span>
        )}
      </Form.ControlLabel>

      {column && (
        <div
          style={{
            marginBottom: 5
          }}
        />
      )}

      <div
        ref={pickerRef}
        style={{
          position:
            'relative',
          width
        }}
      >
        <div
          className="custom-date-input rs-picker"
          style={{
            width: '100%',
            height,
            position:
              'relative'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            name={fieldName}
            disabled={disabled}
            value={
              dateText
            }
            placeholder={
              placeholder ??
              'DD-MM-YYYY'
            }
            className={`rs-input my-input ${
              inputColor
                ? `input-${inputColor}`
                : ''
            }`}
            style={{
              width: '100%',
              height: '100%',
              paddingRight: 38,
              cursor:
                disabled
                  ? 'not-allowed'
                  : 'text'
            }}
            onChange={event => {
              setDateText(
                normalizeDigits(
                  event.target
                    .value
                )
              );
            }}
            onFocus={() => {
              if (
                !disabled &&
                !readOnly
              ) {
                calculateCalendarPosition();
              }
            }}
            onClick={() => {
              openCalendar();
            }}
            onBlur={event => {
              onBlur?.(
                event
              );

              const parsed =
                parseTextDate(
                  event
                    .currentTarget
                    .value,
                  calendarType
                );

              if (!parsed) {
                setDateText(
                  formatDisplayDate(
                    record?.[
                      fieldName
                    ],
                    calendarType
                  )
                );
                return;
              }

              if (
                isDateDisabled(
                  parsed
                )
              ) {
                setDateText(
                  formatDisplayDate(
                    record?.[
                      fieldName
                    ],
                    calendarType
                  )
                );
                return;
              }

              commitDate(
                parsed
              );

              const recordValue =
                parsed;

              const minYearDate =
                new Date(
                  1900,
                  0,
                  1
                );

              minYearDate.setHours(
                0,
                0,
                0,
                0
              );

              if (
                showWarningIfBeforeYear1900 &&
                recordValue <
                  minYearDate
              ) {
                dispatch(
                  notify({
                    msg:
                      'Date cannot be earlier than 1900',
                    sev: 'warning'
                  })
                );

                return;
              }

              const today =
                new Date();

              today.setHours(
                0,
                0,
                0,
                0
              );

              if (
                showWarningIfInPast &&
                recordValue <
                  today
              ) {
                dispatch(
                  notify({
                    msg:
                      'Date is in the past',
                    sev: 'warning'
                  })
                );
              }
            }}
            onKeyDown={event => {
              const input =
                event.currentTarget;

              if (
                event.key ===
                'Enter'
              ) {
                event.preventDefault();

                setIsCalendarOpen(
                  false
                );

                const form =
                  input.form;

                if (form) {
                  const index =
                    Array.prototype.indexOf.call(
                      form,
                      input
                    );

                  const next =
                    form.elements[
                      index + 1
                    ];

                  if (
                    next &&
                    typeof (
                      next as any
                    ).focus ===
                      'function'
                  ) {
                    (
                      next as any
                    ).focus();
                  }
                }

                return;
              }

              if (
                event.key ===
                'Escape'
              ) {
                event.preventDefault();

                setIsCalendarOpen(
                  false
                );

                return;
              }
            }}
          />

          <button
            type="button"
            disabled={
              disabled
            }
            tabIndex={-1}
            onMouseDown={event => {
              event.preventDefault();
            }}
            onClick={() => {
              if (
                disabled ||
                readOnly
              ) {
                return;
              }

              if (
                isCalendarOpen
              ) {
                setIsCalendarOpen(
                  false
                );
                return;
              }

              openCalendar();
            }}
            style={{
              position:
                'absolute',
              right: 0,
              top: 0,
              height: '100%',
              width: 36,
              border: 'none',
              background:
                'transparent',
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              cursor:
                disabled
                  ? 'not-allowed'
                  : 'pointer',
              color:
                '#8c8c8c'
            }}
          >
            <MdCalendarToday
              size={16}
            />
          </button>
        </div>

        {isCalendarOpen &&
          createPortal(
            <div
              className="my-date-hijri-calendar-popup"
              onMouseDown={event => {
                event.stopPropagation();
              }}
              style={{
                position:
                  'fixed',
                top:
                  calendarPosition.top,
                left:
                  calendarPosition.left,
                width:
                  popupWidth,
                zIndex:
                  100050,
                padding: 8,
                border:
                  '1px solid var(--rs-border-primary)',
                borderRadius: 6,
                background:
                  'var(--rs-bg-card)',
                boxShadow:
                  '0 4px 12px rgba(0,0,0,0.15)',
                boxSizing:
                  'border-box'
              }}
            >

              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'space-between',
                  gap: 8,
                  paddingBottom: 8,
                  marginBottom: 8,
                  borderBottom:
                    '1px solid var(--rs-border-primary)'
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    opacity: 0.75
                  }}
                >
                  Calendar
                </span>

                <div
                  style={{
                    display: 'flex',
                    gap: 4,
                    padding: 2,
                    borderRadius: 5,
                    background:
                      'var(--rs-bg-well)'
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleCalendarTypeChange(
                        'GREGORIAN'
                      )
                    }
                    style={{
                      border:
                        'none',
                      borderRadius: 4,
                      padding:
                        '5px 9px',
                      cursor:
                        'pointer',
                      fontSize:
                        11,
                      fontWeight:
                        600,
                      background:
                        calendarType ===
                        'GREGORIAN'
                          ? 'var(--rs-primary-500)'
                          : 'transparent',
                      color:
                        calendarType ===
                        'GREGORIAN'
                          ? '#fff'
                          : 'inherit'
                    }}
                  >
                    Gregorian
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleCalendarTypeChange(
                        'HIJRI'
                      )
                    }
                    style={{
                      border:
                        'none',
                      borderRadius: 4,
                      padding:
                        '5px 9px',
                      cursor:
                        'pointer',
                      fontSize:
                        11,
                      fontWeight:
                        600,
                      background:
                        calendarType ===
                        'HIJRI'
                          ? 'var(--rs-primary-500)'
                          : 'transparent',
                      color:
                        calendarType ===
                        'HIJRI'
                          ? '#fff'
                          : 'inherit'
                    }}
                  >
                    Hijri
                  </button>
                </div>
              </div>


              {calendarType ===
                'GREGORIAN' ? (
                <GregorianCalendar
                  value={
                    currentDate
                  }
                  isDateDisabled={
                    isDateDisabled
                  }
                  onChange={selectedDate => {
                    if (
                      isDateDisabled(
                        selectedDate
                      )
                    ) {
                      return;
                    }

                    commitDate(
                      selectedDate
                    );

                    setIsCalendarOpen(
                      false
                    );
                  }}
                />
              ) : (
                <HijriCalendar
                  value={
                    currentDate
                  }
                  isDateDisabled={
                    isDateDisabled
                  }
                  onChange={selectedDate => {
                    if (
                      isDateDisabled(
                        selectedDate
                      )
                    ) {
                      return;
                    }

                    commitDate(
                      selectedDate
                    );

                    setIsCalendarOpen(
                      false
                    );
                  }}
                />
              )}

              <div
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop:
                    '1px solid var(--rs-border-primary)',
                  textAlign:
                    'center'
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    opacity:
                      0.75
                  }}
                >
                  {calendarType ===
                  'HIJRI'
                    ? normalizeDigits(
                        momentHijri(
                          currentDate
                        )
                          .locale(
                            'en'
                          )
                          .format(
                            'iDD-iMM-iYYYY'
                          )
                      )
                    : normalizeDigits(
                        dayjs(
                          currentDate
                        ).format(
                          'DD-MM-YYYY'
                        )
                      )}
                </span>
              </div>
            </div>,
            document.body
          )}
      </div>
    </Form.Group>
  );
};

export default MyDateHijriInput;