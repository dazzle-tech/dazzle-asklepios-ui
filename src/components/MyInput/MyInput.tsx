import { camelCaseToLabel, fromCamelCaseToDBName, formatEnumString } from '@/utils';
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckPicker, TimePicker } from 'rsuite';
import {
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  SelectPicker,
  TagPicker,
  Toggle,
  InputGroup
} from 'rsuite';
import MyLabel from '../MyLabel';
import Translate from '../Translate';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import dayjs from 'dayjs';
import { InputPicker } from 'rsuite';
import { MdCalendarToday } from 'react-icons/md';
const Textarea = React.forwardRef((props, ref: any) => (
  <Input {...props} as="textarea" ref={ref} />
));

const CustomDatePicker = React.forwardRef((props, ref: any) => (
  <DatePicker
    {...props}
    format="dd-MM-yyyy"
    editable
    cleanable={false}
    block
    ref={ref}
    menuClassName={clsx('my-input-calendar-popup', props?.menuClassName)}
  />
));

const CustomDateTimePicker = React.forwardRef((props: any, ref: any) => (
  <DatePicker
    {...props}
    format="dd-MM-yyyy HH:mm"
    cleanable={false}
    block
    ref={ref}
    menuClassName={clsx('my-input-calendar-popup', props?.menuClassName)}
  />
));

const focusNextField = (e: any) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const form = e.target.form;
    const index = Array.prototype.indexOf.call(form, e.target);
    const next = form?.elements[index + 1];
    if (next && typeof next.focus === 'function') {
      next.focus();
    }
  }
};

type MyInputProps = {
  fieldName: string;
  fieldType?:
  | 'text'
  | 'password'
  | 'textarea'
  | 'checkbox'
  | 'datetime'
  | 'time'
  | 'select'
  | 'selectPagination'
  | 'multyPicker'
  | 'checkPicker'
  | 'date'
  | 'number'
  | 'check'
  | 'textnumber'
  | 'color'
  ;
  record: any;
  rightAddonwidth?: number | 'auto' | null;
  rightAddon?: React.ReactNode | null;
  leftAddon?: React.ReactNode | null;
  leftAddonwidth?: number | 'auto' | null;
  setRecord?: (r: any) => void;
  searchKeyWard?: any;
  setSearchKeyWard?: (r: any) => void;
  vr?: any;
  rows?: number;
  showLabel?: boolean;
  className?: string;
  width?: number | string;
  height?: number;
  inputColor?: string;
  disabled?: boolean;
  placeholder?: string;
  placement?: any;
  preventOverflow?: boolean;
  container?: HTMLElement | (() => HTMLElement);
  selectData?: any[];
  selectDataLabel?: string | string[];
  selectDataValue?: string;
  renderMenuItem?: any;
  renderOptionLabel?: (item: any) => string;
  searchBy?: any;
  searchable?: boolean;
  cleanable?: boolean;
  readOnly?: boolean;
  loading?: boolean;
  defaultSelectValue?: any;
  virtualized?: boolean;
  menuMaxHeight?: number;
  menuClassName?: string;
  hasMore?: boolean;
  onFetchMore?: () => void;
  onBlur?: (e?: any) => void;
  creatable?: boolean;
  groupBy?: string | null;
  onSelectItem?: (item: any) => void;
  max?: number;
  defaultChecked?: boolean;
  checkedLabel?: string;
  unCheckedLabel?: string;
  label?: string;
  required?: boolean;
  column?: boolean;
  fieldLabel?: string;
  enterClick?: () => Promise<boolean | void> | boolean | void;
  isEnum?: boolean;
  allowEnterNewLine?: boolean;
  showZero?: boolean;
  disablePastDates?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disableFutureDates?: boolean;
  showWarningIfBeforeYear1900?: boolean;
  showWarningIfInPast?: boolean;
  min?: number;
  step?: number;
  allowDecimal?: boolean;
  disabledItemValues?: boolean;
  disableByField?: string;
  disableByFieldValue?: any;
};

const MyInput = ({
  fieldName,
  fieldType = 'text',
  record,
  rightAddonwidth = null,
  rightAddon = null,
  leftAddon = null,
  leftAddonwidth = null,
  setRecord = undefined,
  vr = undefined,
  rows = 1,
  showLabel = true,
  className = '',
  ...props
}: MyInputProps) => {
  const dispatch = useAppDispatch();
  const uiSlice = useAppSelector(state => state.ui);
  const recognitionRef = useRef<any>(null);
  const [recording, setRecording] = useState(false);

  const inputColor = props.inputColor || record?.inputColor || '';
  const mode = useSelector((state: any) => state.ui.mode);
  const [validationResult, setValidationResult] = useState<any[] | undefined>(undefined);

  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [portaledSelectOpen, setPortaledSelectOpen] = useState(false);
  const [portaledSelectBox, setPortaledSelectBox] = useState({ top: 0, left: 0, width: 0 });
  const portaledSelectMenuRef = useRef<HTMLDivElement | null>(null);
  const selectOpenGuardRef = useRef(0);
  const loadMoreClickedRef = useRef(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const dateOpenGuardRef = useRef(0);
  const [dateText, setDateText] = useState('');
  const dateTextRef = useRef<HTMLInputElement>(null);

  const [dateTimeText, setDateTimeText] = useState('');
  const dateTimeTextRef = useRef<HTMLInputElement>(null);
  const [isDateTimeOpen, setIsDateTimeOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isMultyPickerOpen, setIsMultyPickerOpen] = useState(false);
  const [isCheckPickerOpen, setIsCheckPickerOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localSearch, setLocalSearch] = useState('');


  const allowEnterNewLine = props.allowEnterNewLine ?? true;

  const formatDateTimeText = (value: any) => {
    if (!value) return '';

    const date = dayjs(value);

    if (!date.isValid()) return '';

    return date.format('DD-MM-YYYY HH:mm');
  };

  const getDateTimeFromText = (text: string) => {
    const match = text.match(
      /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/
    );

    if (!match) return null;

    const [, day, month, year, hour, minute] = match;

    const parsed = dayjs(
      `${year}-${month}-${day} ${hour}:${minute}`,
      'YYYY-MM-DD HH:mm',
      true
    );

    return parsed.isValid() ? parsed : null;
  };

  useEffect(() => {
    if (isSelectOpen) {
      selectOpenGuardRef.current = Date.now();
    }
  }, [isSelectOpen]);

  useEffect(() => {
    if (isDateOpen) {
      dateOpenGuardRef.current = Date.now();
    }
  }, [isDateOpen]);

  useEffect(() => {
    if (!isDateOpen && !isDateTimeOpen) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      if (pickerRef.current?.contains(target)) return;
      if (
        target.closest?.(
          '.rs-picker-date-menu, .rs-picker-popup, .rs-calendar, .rs-calendar-panel, .my-input-calendar-popup'
        )
      ) {
        return;
      }
      setIsDateOpen(false);
      setIsDateTimeOpen(false);
    };

    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', onMouseDown, true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', onMouseDown, true);
    };
  }, [isDateOpen, isDateTimeOpen]);

  useEffect(() => {
    const handleScroll = event => {
      const targetEl = event.target as Element | null;
      if (
        targetEl?.closest?.(
          '.rs-picker-popup, .rs-picker-date-menu, .rs-calendar, .rs-calendar-panel, .my-input-calendar-popup'
        )
      ) {
        return;
      }

      if (isDateOpen || isDateTimeOpen) {
        return;
      }

      if (document.querySelector('.rs-picker-popup')) {
        return;
      }
      if (Date.now() - selectOpenGuardRef.current < 300) {
        return;
      }

      const path = event.composedPath ? event.composedPath() : [];

      const menuClassList = [
        'rs-picker-popup',
        'rs-picker-select-menu',
        'rs-picker-menu',
        'rs-virtual-list',
        'rs-virtual-list-scrollbar',
        'rs-picker-tag-menu',
        'rs-picker-date-menu',
        'rs-calendar-panel',
        'rs-calendar'
      ];

      if (path.some(el => menuClassList.some(cls => el?.classList?.contains?.(cls)))) {
        return;
      }

      const openPopup = document.querySelector('.rs-picker-popup');
      if (openPopup && openPopup.contains(event.target as Node)) {
        return;
      }

      setIsSelectOpen(false);
      setIsDateOpen(false);
      setIsDateTimeOpen(false);
      setIsTimeOpen(false);
      setIsMultyPickerOpen(false);
      setIsCheckPickerOpen(false);
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isDateOpen, isDateTimeOpen]);

  useEffect(() => {
    const fieldDbName = fromCamelCaseToDBName(fieldName);
    if (vr && vr.details && vr.details[fieldDbName]) {
      setValidationResult([...vr.details[fieldDbName]]);
    } else {
      setValidationResult(undefined);
    }
  }, [vr, fieldName]);

  useEffect(() => {
    if (props.disabled && recording) {
      stopListening();
      setRecording(false);
    }
  }, [props.disabled, recording]);

  const formatDateText = (value: any) => {
    if (!value) return '';

    const date = dayjs(value);

    if (!date.isValid()) return '';

    return date.format('DD-MM-YYYY');
  };

  const getDateFromText = (text: string) => {
    const match = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);

    if (!match) return null;

    const [, day, month, year] = match;

    const parsed = dayjs(
      `${year}-${month}-${day}`,
      'YYYY-MM-DD',
      true
    );

    return parsed.isValid() ? parsed : null;
  };

  const updateDateFromText = (
    text: string,
    commit = true
  ) => {
    setDateText(text);

    if (!commit) return;

    const parsed = getDateFromText(text);

    if (!parsed) return;

    setRecord?.({
      ...record,
      [fieldName]: parsed.format('YYYY-MM-DD')
    });
  };

  const fieldLabel = props?.fieldLabel ?? camelCaseToLabel(fieldName ?? '');

  const handleValueChange = (value: any) => {
    if (!setRecord || typeof setRecord !== 'function') return;

    if (fieldType === 'date') {
      if (typeof value === 'string') {
        setRecord({ ...record, [fieldName]: value || null });
        return;
      }

      const dateStr = value ? dayjs(value).format('YYYY-MM-DD') : null;
      setRecord({ ...record, [fieldName]: dateStr });
      return;
    }

    if (fieldType === 'number') {
      if (value === '' || value === null || value === undefined) {
        setRecord({ ...record, [fieldName]: null });
        return;
      }

      const numericValue = typeof value === 'number' ? value : Number(value);

      setRecord({
        ...record,
        [fieldName]: Number.isNaN(numericValue) ? null : numericValue
      });
      return;
    }

    setRecord({ ...record, [fieldName]: value });
  };

  const pickerPlacement = props.placement ?? 'autoVerticalStart';
  const pickerPreventOverflow = props.preventOverflow ?? true;

  const getDynamicMenuMaxHeight = (dataList?: any[]) => {
    if (props?.menuMaxHeight !== undefined && props?.menuMaxHeight !== null) {
      return props.menuMaxHeight as number;
    }

    const itemsCount = dataList?.length ?? 0;
    const estimatedItemHeight = 38;
    const headerAllowance = 24;
    const capHeight = 240;

    const visibleItems = Math.max(itemsCount, 3);

    return Math.min(
      capHeight,
      visibleItems * estimatedItemHeight + headerAllowance
    );
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      dispatch(notify({ msg: 'Your browser does not support Speech Recognition', sev: 'error' }));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = uiSlice.lang === 'en' ? 'en-US' : 'ar-SA';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (setRecord && typeof setRecord === 'function') {
        setRecord({ ...record, [fieldName]: transcript });
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  };

  const changeRecordingState = () => {
    if (!props.disabled) {
      if (recording) {
        stopListening();
      } else {
        startListening();
      }
      setRecording(!recording);
    }
  };

  useEffect(() => {
    if (!portaledSelectOpen) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (pickerRef.current?.contains(target)) return;
      if (portaledSelectMenuRef.current?.contains(target)) return;
      setPortaledSelectOpen(false);
      setLocalSearch('');
    };

    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', onMouseDown, true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', onMouseDown, true);
    };
  }, [portaledSelectOpen]);

  const [placement, setPlacement] = useState<'topStart' | 'bottomStart'>('bottomStart');
  const pickerRef = useRef<any>(null);

  const calculatePlacement = (popupHeight = 250) => {
    if (!pickerRef.current) return 'bottomStart';
    const rect = pickerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    if (spaceBelow >= popupHeight) return 'bottomStart';
    if (spaceAbove >= popupHeight) return 'topStart';
    return spaceAbove > spaceBelow ? 'topStart' : 'bottomStart';
  };

  const openCalendar = (kind: 'date' | 'datetime') => {
    if (props.disabled) return;
    dateOpenGuardRef.current = Date.now();
    setPlacement(calculatePlacement(kind === 'datetime' ? 420 : 360));
    if (kind === 'datetime') {
      setIsDateTimeOpen(true);
    } else {
      setIsDateOpen(true);
    }
  };

  // Anchor the hidden RSuite DatePicker to the visible input edge so the
  // popup sits flush under/above the field instead of leaving a large gap.
  const getCalendarTriggerStyle = (kind: 'date' | 'datetime'): React.CSSProperties => {
    const open = kind === 'datetime' ? isDateTimeOpen : isDateOpen;
    const placeAbove = open && String(placement).startsWith('top');
    return {
      position: 'absolute',
      left: 0,
      right: 0,
      width: '100%',
      height: 0,
      top: placeAbove ? 0 : '100%',
      opacity: 0,
      pointerEvents: 'none',
      overflow: 'hidden'
    };
  };

  const resolveContainer = () => {
    if (props.container) {
      return typeof props.container === 'function' ? props.container() : props.container;
    }

    const pickerElement = pickerRef.current as HTMLElement | null;

    if (
      pickerElement?.closest(
        '.profile-sidebar-container, .book-patient-sidebar-overlay, .rs-modal-wrapper, .rs-drawer'
      )
    ) {
      return document.body;
    }

    return (
      pickerElement?.closest('.sub-child-right-modal .rs-modal-body') ||
      pickerElement?.closest('.child-right-modal .rs-modal-body') ||
      pickerElement?.closest('.right-modal .rs-modal-body') ||
      pickerElement?.closest('.rs-modal-body') ||
      pickerElement?.closest('.rs-drawer-body') ||
      pickerElement?.closest('.rs-content') ||
      document.body
    ) as HTMLElement;
  };

  const focusPickerSearch = () => {
    window.requestAnimationFrame(() => {
      const input = document.querySelector(
        '.rs-picker-popup:not(.rs-anim-leave) .rs-picker-search-bar-input, .rs-picker-popup:not(.rs-anim-leave) .rs-picker-search-bar input'
      ) as HTMLInputElement | null;
      if (!input) return;
      input.disabled = false;
      input.readOnly = false;
      input.focus();
    });
  };

  const buildCombinedLabel = (item: any, labelKeys: string[], fallback: any) => {
    if (!item || !labelKeys?.length) return fallback;
    const parts = labelKeys
      .map(key => (key ? item[key] : undefined))
      .filter(v => v !== undefined && v !== null && v !== '');
    const combined = parts.join(' ').trim();
    return combined || fallback;
  };
  const getDisabledValues = (
  dataList: any[],
  valueKey: string
) => {
  if (props.disabledItemValues) {
    return dataList.map(item => item[valueKey]);
  }

  if (props.disableByField) {
    const expectedValue =
      props.disableByFieldValue ?? false;

    return dataList
      .filter(
        item =>
          item?.[props.disableByField] ===
          expectedValue
      )
      .map(item => item[valueKey]);
  }

  return [];
};

  const isPickerSearchable = props.searchable ?? true;

const shouldVirtualizePicker = (itemCount = 0) => {
    if (isPickerSearchable) return false;
    if (props.virtualized !== undefined) return Boolean(props.virtualized);
    return itemCount > 20;
  };
  const getPickerItemSearchText = (
    item: any,
    labelKeys: string[],
    isArrayLabel: boolean,
    isEnum?: boolean
  ) => {
    if (!item) return '';
    const raw = isArrayLabel
      ? String(buildCombinedLabel(item, labelKeys, '') ?? '')
      : String(item?.[labelKeys[0] ?? 'label'] ?? '');
    return isEnum ? `${raw} ${formatEnumString(raw)}`.trim() : raw;
  };

  const resolvePickerSearchBy = (
    labelKeys: string[],
    isArrayLabel: boolean,
    isEnum?: boolean,
    skipClientFilter?: boolean
  ) => {
    if (skipClientFilter) {
      return () => true;
    }
    if (props.searchBy) {
      return props.searchBy;
    }
return (keyword: string, label: any, item: any) => {
      if (item?.isLoadMore) return !String(keyword ?? '').trim();
      const needle = String(keyword ?? '').trim().toLowerCase();
      if (!needle) return true;
      const fromItem = getPickerItemSearchText(item, labelKeys, isArrayLabel, isEnum);
      const fromLabel = typeof label === 'string' ? label : '';
      return `${fromItem} ${fromLabel}`.toLowerCase().includes(needle);
    };
  };


  const conjureFormControl = () => {
    switch (fieldType) {
      case 'textarea':
        return (
          <InputGroup style={{ width: props?.width ?? 200 }}>
            <Form.Control
              style={{ width: '100%', height: props?.height ?? 70 }}
              disabled={props.disabled}
              name={fieldName}
              placeholder={props.placeholder}
              value={record[fieldName] ? record[fieldName] : ''}
              accepter={Textarea}
              onChange={handleValueChange}
              onBlur={props.onBlur}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (allowEnterNewLine) {
                    return;
                  }
                  focusNextField(e);
                }
              }}
            />
            {!props.disabled && (
              <div
                className={`container-of-search-icon-textarea ${recording ? 'recording' : ''}`}
                onClick={changeRecordingState}
                style={{ position: 'relative' }}
              >
                {recording && <span className="pulse-ring"></span>}
              </div>
            )}
          </InputGroup>
        );

      case 'checkbox':
        return (
          <Toggle
            name={fieldName}
            style={{ width: props?.width ?? 145, height: props?.height ?? 30 }}
            checkedChildren={<Translate>{props.checkedLabel || 'Yes'}</Translate>}
            unCheckedChildren={<Translate>{props.unCheckedLabel || 'No'}</Translate>}
            disabled={props.disabled}
            checked={record[fieldName] == null ? false : !!record[fieldName]}
            onChange={handleValueChange}
            defaultChecked={props.defaultChecked}
            onKeyDown={focusNextField}
          />
        );


      case 'datetime': {
        const currentDateTimeText =
          dateTimeText || formatDateTimeText(record?.[fieldName]);

        return (
          <div
            ref={pickerRef}
            style={{
              position: 'relative',
              width: props?.width ?? 145
            }}
          >
            {/* Hidden RSuite DatePicker - calendar + time only */}
            <DatePicker
              value={
                record?.[fieldName]
                  ? new Date(record[fieldName])
                  : null
              }
              onChange={(value: Date | null) => {
                if (!value) {
                  setDateTimeText('');

                  setRecord?.({
                    ...record,
                    [fieldName]: null
                  });

                  setIsDateTimeOpen(false);
                  return;
                }

                const formatted = dayjs(value).format(
                  'DD-MM-YYYY HH:mm'
                );

                setDateTimeText(formatted);

                setRecord?.({
                  ...record,
                  [fieldName]: dayjs(value).toISOString()
                });

                setIsDateTimeOpen(false);
              }}
              format="dd-MM-yyyy HH:mm"
              cleanable={false}
              editable={false}

              menuClassName={clsx(
                'my-input-calendar-popup',
                props?.menuClassName
              )}

              open={isDateTimeOpen}
              onOpen={() => {
                dateOpenGuardRef.current = Date.now();
              }}
              onClose={() => undefined}
              placement={placement}
              preventOverflow={false}
              container={() => document.body}

              shouldDisableDate={(date: Date) => {
                const today = new Date(
                  new Date().setHours(0, 0, 0, 0)
                );

                if (props.disablePastDates) {
                  return date < today;
                }

                if (props.disableFutureDates) {
                  return date > today;
                }

                return false;
              }}

              className="my-input-date-trigger"
              style={getCalendarTriggerStyle('datetime')}
            />

            {/* Real DateTime input */}
            <div
              className="custom-date-input rs-picker"
              style={{
                width: props?.width ?? 145,
                height: props?.height ?? 30,
                position: 'relative'
              }}
            >
              <input
                ref={dateTimeTextRef}
                type="text"
                name={fieldName}
                disabled={props.disabled}
                value={currentDateTimeText}
                placeholder={
                  props.placeholder ?? 'DD-MM-YYYY HH:mm'
                }
                className={`rs-input my-input ${inputColor ? `input-${inputColor}` : ''
                  }`}
                style={{
                  width: '100%',
                  height: '100%',
                  paddingRight: 38,
                  cursor: props.disabled
                    ? 'not-allowed'
                    : 'text'
                }}

                onChange={() => {
                  // Manual keyboard handling
                }}

                onFocus={() => {
                  if (!props.disabled) {
                    setPlacement(calculatePlacement(420));
                  }
                }}

                onClick={() => {
                  openCalendar('datetime');
                }}

                onBlur={() => {
                  const value =
                    dateTimeTextRef.current?.value || '';

                  const parsed =
                    getDateTimeFromText(value);

                  if (parsed) {
                    setRecord?.({
                      ...record,
                      [fieldName]: parsed.toISOString()
                    });
                  }

                  const recordValue = parsed
                    ? parsed.toDate()
                    : record?.[fieldName]
                      ? new Date(record[fieldName])
                      : null;

                  if (!recordValue) return;

                  const minDate = new Date(1900, 0, 1);

                  const today = new Date(
                    new Date().setHours(0, 0, 0, 0)
                  );

                  if (
                    props.showWarningIfBeforeYear1900 &&
                    recordValue < minDate
                  ) {
                    dispatch(
                      notify({
                        msg: 'Date cannot be before 01-01-1900',
                        sev: 'warning'
                      })
                    );

                    return;
                  }

                  if (
                    props.showWarningIfInPast &&
                    recordValue < today
                  ) {
                    dispatch(
                      notify({
                        msg: 'Date cannot be in the past',
                        sev: 'warning'
                      })
                    );
                  }
                }}

                onKeyDown={(
                  e: React.KeyboardEvent<HTMLInputElement>
                ) => {
                  const input = e.currentTarget;

                  /*
                  * ENTER
                  */
                  if (e.key === 'Enter') {
                    e.preventDefault();

                    setIsDateTimeOpen(false);
                    focusNextField(e);

                    return;
                  }

                  /*
                  * ESC
                  */
                  if (e.key === 'Escape') {
                    e.preventDefault();

                    setIsDateTimeOpen(false);

                    return;
                  }

                  /*
                  * CTRL + A
                  */
                  if (
                    e.ctrlKey &&
                    e.key.toLowerCase() === 'a'
                  ) {
                    e.preventDefault();

                    input.setSelectionRange(0, 16);

                    return;
                  }

                  /*
                  * LEFT / RIGHT
                  *
                  * DD-MM-YYYY HH:mm
                  *
                  * 0123456789012345
                  *       ↑
                  */
                  if (
                    e.key === 'ArrowLeft' ||
                    e.key === 'ArrowRight'
                  ) {
                    e.preventDefault();

                    const current =
                      input.selectionStart ?? 0;

                    let next =
                      e.key === 'ArrowRight'
                        ? current + 1
                        : current - 1;

                    /*
                    * Skip separators:
                    *
                    * position 2  = -
                    * position 5  = -
                    * position 10 = space
                    * position 13 = :
                    */
                    if (
                      next === 2 ||
                      next === 5 ||
                      next === 10 ||
                      next === 13
                    ) {
                      next +=
                        e.key === 'ArrowRight'
                          ? 1
                          : -1;
                    }

                    next = Math.max(
                      0,
                      Math.min(16, next)
                    );

                    input.setSelectionRange(
                      next,
                      next
                    );

                    return;
                  }

                  /*
                  * TAB
                  */
                  if (e.key === 'Tab') {
                    return;
                  }
                  if (e.key === 'Backspace') {
                    e.preventDefault();

                    const value =
                      input.value ||
                      '01-01-2000 00:00';

                    let position =
                      input.selectionStart ?? 0;
                    if (
                      input.selectionStart !==
                      input.selectionEnd
                    ) {
                      const start =
                        input.selectionStart ?? 0;

                      const end =
                        input.selectionEnd ?? start;

                      const chars =
                        value.split('');

                      for (
                        let i = start;
                        i < end;
                        i++
                      ) {
                        if (
                          chars[i] !== '-' &&
                          chars[i] !== ' ' &&
                          chars[i] !== ':'
                        ) {
                          chars[i] = '0';
                        }
                      }

                      const newValue =
                        chars.join('');

                      setDateTimeText(newValue);

                      setTimeout(() => {
                        input.setSelectionRange(
                          start,
                          start
                        );
                      }, 0);

                      return;
                    }

                    if (position <= 0) return;

                    let deletePosition =
                      position - 1;
                    while (
                      deletePosition >= 0 &&
                      (
                        value[deletePosition] === '-' ||
                        value[deletePosition] === ' ' ||
                        value[deletePosition] === ':'
                      )
                    ) {
                      deletePosition--;
                    }

                    if (deletePosition < 0) return;

                    const chars =
                      value.split('');

                    chars[deletePosition] = '0';

                    const newValue =
                      chars.join('');

                    setDateTimeText(newValue);

                    setTimeout(() => {
                      input.setSelectionRange(
                        deletePosition,
                        deletePosition
                      );
                    }, 0);

                    return;
                  }
                  if (e.key === 'Delete') {
                    e.preventDefault();

                    const value =
                      input.value ||
                      '01-01-2000 00:00';

                    const position =
                      input.selectionStart ?? 0;

                    if (position >= 16) return;

                    let deletePosition =
                      position;

                    while (
                      deletePosition < 16 &&
                      (
                        value[deletePosition] === '-' ||
                        value[deletePosition] === ' ' ||
                        value[deletePosition] === ':'
                      )
                    ) {
                      deletePosition++;
                    }

                    if (deletePosition >= 16) return;

                    const chars =
                      value.split('');

                    chars[deletePosition] = '0';

                    const newValue =
                      chars.join('');

                    setDateTimeText(newValue);

                    setTimeout(() => {
                      input.setSelectionRange(
                        deletePosition,
                        deletePosition
                      );
                    }, 0);

                    return;
                  }

                  if (/^\d$/.test(e.key)) {
                    e.preventDefault();

                    const value =
                      input.value ||
                      '01-01-2000 00:00';

                    let position =
                      input.selectionStart ?? 0;

                    const selectionEnd =
                      input.selectionEnd ?? 0;

                    if (
                      position >= 0 &&
                      position <= 1
                    ) {
                      const chars =
                        value.split('');

                      chars[position] = e.key;

                      const newValue =
                        chars.join('');

                      setDateTimeText(newValue);

                      const next =
                        position === 1
                          ? 3
                          : 1;

                      setTimeout(() => {
                        input.setSelectionRange(
                          next,
                          next
                        );
                      }, 0);

                      return;
                    }

                    if (
                      position >= 3 &&
                      position <= 4
                    ) {
                      const chars =
                        value.split('');

                      chars[position] = e.key;

                      const newValue =
                        chars.join('');

                      setDateTimeText(newValue);

                      const next =
                        position === 4
                          ? 6
                          : 4;

                      setTimeout(() => {
                        input.setSelectionRange(
                          next,
                          next
                        );
                      }, 0);

                      return;
                    }
                    if (
                      position >= 6 &&
                      position <= 9
                    ) {
                      e.stopPropagation();

                      let year =
                        value.substring(6, 10);
                      if (
                        position === 6 ||
                        selectionEnd === 10
                      ) {
                        year = `${e.key}000`;
                        position = 6;
                      } else {
                        const yearChars =
                          year.split('');

                        yearChars[
                          position - 6
                        ] = e.key;

                        year =
                          yearChars.join('');
                      }

                      const newValue =
                        value.substring(0, 6) +
                        year +
                        value.substring(10);

                      setDateTimeText(newValue);

                      const next =
                        Math.min(
                          position + 1,
                          11
                        );

                      setTimeout(() => {
                        input.setSelectionRange(
                          next,
                          next
                        );
                      }, 0);

                      return;
                    }
                    if (
                      position >= 11 &&
                      position <= 12
                    ) {
                      const chars =
                        value.split('');

                      chars[position] = e.key;

                      const newValue =
                        chars.join('');

                      setDateTimeText(newValue);

                      const next =
                        position === 12
                          ? 14
                          : 12;

                      setTimeout(() => {
                        input.setSelectionRange(
                          next,
                          next
                        );
                      }, 0);

                      return;
                    }
                    if (
                      position >= 14 &&
                      position <= 15
                    ) {
                      const chars =
                        value.split('');

                      chars[position] = e.key;

                      const newValue =
                        chars.join('');

                      setDateTimeText(newValue);

                      const next =
                        Math.min(
                          position + 1,
                          16
                        );

                      setTimeout(() => {
                        input.setSelectionRange(
                          next,
                          next
                        );
                      }, 0);

                      return;
                    }
                  }
                }}
              />

              <button
                type="button"
                disabled={props.disabled}
                tabIndex={-1}
                onMouseDown={e => {
                  e.preventDefault();
                }}
                onClick={() => {
                  if (props.disabled) return;
                  if (isDateTimeOpen) {
                    setIsDateTimeOpen(false);
                    return;
                  }
                  openCalendar('datetime');
                }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  height: '100%',
                  width: 36,
                  border: 'none',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: props.disabled
                    ? 'not-allowed'
                    : 'pointer',
                  color: '#8c8c8c'
                }}
              >
                <MdCalendarToday size={16} />
              </button>
            </div>
          </div>
        );
      }


      case 'time':
        return (
          <Form.Control
            className="custom-date-input"
            style={
              {
                width: props?.width ?? 145,
                '--input-height': `${props?.height ?? 30}px`
              } as React.CSSProperties
            }
            disabled={props.disabled}
            name={fieldName}
            accepter={TimePicker}
            value={
              record[fieldName]
                ? (() => {
                  const [h, m, s] = record[fieldName].split(':').map(Number);
                  const d = new Date(1970, 0, 1, h, m, s ?? 0);
                  return d;
                })()
                : null
            }
            onChange={(value: Date | null) => {
              if (!value) {
                setRecord?.({ ...record, [fieldName]: null });
                return;
              }
              const h = String(value.getHours()).padStart(2, '0');
              const m = String(value.getMinutes()).padStart(2, '0');
              const s = String(value.getSeconds()).padStart(2, '0');
              setRecord?.({ ...record, [fieldName]: `${h}:${m}:${s}` });
            }}
            placeholder={props.placeholder ?? 'HH:mm'}
            format="HH:mm"
            cleanable={false}
            onKeyDown={focusNextField}
            open={isTimeOpen}
            onOpen={() => {
              setPlacement(calculatePlacement());
              setIsTimeOpen(true);
            }}
            onClose={() => setIsTimeOpen(false)}
            placement={placement}
            preventOverflow={pickerPreventOverflow}
            container={resolveContainer()}
          />
        );

      case 'select': {
        const isArrayLabel = Array.isArray(props.selectDataLabel);

        const labelKeys = isArrayLabel
          ? (props.selectDataLabel as string[])
          : [props.selectDataLabel ?? 'label'];

        const primaryLabelKey = labelKeys[0] ?? 'label';

        const valueKey = props?.selectDataValue ?? 'value';

        const dataList = props?.selectData ?? [];
        const pickerSearchBy = resolvePickerSearchBy(
          labelKeys,
          isArrayLabel,
          props.isEnum
        );

        const filteredData = !localSearch
          ? dataList
          : dataList.filter(item => pickerSearchBy(localSearch, '', item));

        const longestLabel = dataList.reduce(
          (longest, item) => {
            const text = getPickerItemSearchText(
              item,
              labelKeys,
              isArrayLabel,
              props.isEnum
            );

            return text.length > longest.length
              ? text
              : longest;
          },
          ''
        );

        const popupWidth = Math.max(
          typeof props?.width === 'number'
            ? props.width
            : 145,
          longestLabel.length * 9 + 120
        );

        const dataForPicker =
          isPickerSearchable && localSearch ? filteredData : dataList;

        const selectedSelectItem = dataList.find(
          (item: any) => String(item?.[valueKey]) === String(record?.[fieldName] ?? '')
        );
        const selectedSelectLabel =
          (selectedSelectItem &&
            (isArrayLabel
              ? buildCombinedLabel(selectedSelectItem, labelKeys, '')
              : selectedSelectItem?.[primaryLabelKey])) ||
          props.placeholder ||
          '';
        const disabledSelectValues = getDisabledValues(dataList, valueKey);

        const renderSelectLabel = (item: any, fallback: any) => {
          if (props.renderMenuItem) {
            return props.renderMenuItem(
              item?.[primaryLabelKey],
              item
            );
          }
          if (isArrayLabel) {
            return (
              <Translate>
                {buildCombinedLabel(item, labelKeys, fallback)}
              </Translate>
            );
          }
          if (props.isEnum) {
            return (
              <Translate>
                {formatEnumString(String(item?.[primaryLabelKey] ?? fallback ?? ''))}
              </Translate>
            );
          }
          return (
            <Translate>
              {String(item?.[primaryLabelKey] ?? fallback ?? '')}
            </Translate>
          );
        };

        if (props.container) {
          return (
            <div
              ref={pickerRef}
              className={clsx(
                'my-input-portaled-select',
                inputColor ? `input-${inputColor}` : ''
              )}
              style={{ width: props?.width ?? '100%', maxWidth: '100%' }}
              onMouseDown={event => event.stopPropagation()}
            >
              <button
                type="button"
                className={clsx('my-input-portaled-select-toggle', {
                  open: portaledSelectOpen
                })}
                disabled={props.disabled}
                aria-haspopup="listbox"
                aria-expanded={portaledSelectOpen}
                onMouseDown={event => {
                  event.stopPropagation();
                }}
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  const toggle =
                    (pickerRef.current?.querySelector(
                      '.my-input-portaled-select-toggle'
                    ) as HTMLElement | null) ?? pickerRef.current;
                  const rect = toggle?.getBoundingClientRect();
                  if (!rect) return;
                  const menuHeight = Math.min(
                    240,
                    Math.max(dataForPicker.length, 1) * 36 + 8
                  );
                  const openUpward = window.innerHeight - rect.bottom < menuHeight + 8;
                  setPortaledSelectBox({
                    top: openUpward ? Math.max(8, rect.top - menuHeight - 4) : rect.bottom + 4,
                    left: rect.left,
                    width: rect.width
                  });
                  setPortaledSelectOpen(open => !open);
                }}
              >
                <span className="my-input-portaled-select-value">
                  {selectedSelectItem
                    ? renderSelectLabel(selectedSelectItem, selectedSelectLabel)
                    : selectedSelectLabel}
                </span>
                <span className="my-input-portaled-select-caret" aria-hidden>
                  ▾
                </span>
              </button>
              {portaledSelectOpen &&
                createPortal(
                  <div
                    ref={portaledSelectMenuRef}
                    className={clsx(
                      'my-input-portaled-select-menu',
                      props.menuClassName
                    )}
                    role="listbox"
                    style={{
                      top: portaledSelectBox.top,
                      left: portaledSelectBox.left,
                      width: portaledSelectBox.width,
                      minWidth: portaledSelectBox.width,
                      maxWidth: portaledSelectBox.width,
                      boxSizing: 'border-box',
                      maxHeight: getDynamicMenuMaxHeight(dataForPicker)
                    }}
                    onMouseDown={event => event.stopPropagation()}
                  >
                    {isPickerSearchable && (
                      <input
                        className="my-input-portaled-select-search"
                        type="text"
                        value={localSearch}
                        placeholder="Search"
                        autoFocus
                        onMouseDown={event => event.stopPropagation()}
                        onChange={event => setLocalSearch(event.target.value)}
                      />
                    )}
                    {dataForPicker.length ? (
                      dataForPicker.map((item: any) => {
                        const itemValue = item?.[valueKey];
                        const selected =
                          String(itemValue) === String(record?.[fieldName] ?? '');
                        const disabled = disabledSelectValues.includes(itemValue);

                        return (
                          <button
                            key={String(itemValue)}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            disabled={disabled}
                            className={clsx('my-input-portaled-select-option', {
                              selected,
                              disabled
                            })}
                            onMouseDown={event => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                            onClick={event => {
                              event.preventDefault();
                              event.stopPropagation();
                              if (disabled) return;
                              handleValueChange(itemValue);
                              if (props.onSelectItem) {
                                props.onSelectItem(item);
                              }
                              setPortaledSelectOpen(false);
                            }}
                          >
                            {renderSelectLabel(item, item?.[primaryLabelKey])}
                          </button>
                        );
                      })
                    ) : (
                      <div className="my-input-portaled-select-empty">No options</div>
                    )}
                  </div>,
                  document.body
                )}
            </div>
          );
        }

        return (
          <div ref={pickerRef}>
            <SelectPicker
              style={{
                width: props?.width ?? 145,
                height: props?.height ?? 30
              }}
              className={`arrow-number-style my-input ${inputColor ? `input-${inputColor}` : ''
                }`}
              block={props?.width === '100%'}
              disabled={props.disabled}
              searchable={isPickerSearchable}
              data={dataList}
              labelKey={primaryLabelKey}
              valueKey={valueKey}
              searchBy={pickerSearchBy}
              value={
                record?.[fieldName] !== undefined &&
                  record?.[fieldName] !== null
                  ? record[fieldName]
                  : null
              }
              onChange={value => {
                handleValueChange(value);

                if (props.onSelectItem) {
                  const selectedItem =
                    dataList.find(
                      (x: any) =>
                        String(x?.[valueKey]) === String(value)
                    ) ?? null;

                  props.onSelectItem(selectedItem);
                }
              }}
              renderMenuItem={
                props.renderMenuItem ??
                (isArrayLabel
                  ? (
                    label: any,
                    item: any
                  ) => (
                    <Translate>
                      {buildCombinedLabel(
                        item,
                        labelKeys,
                        label
                      )}
                    </Translate>
                  )
                  : props.isEnum
                    ? (label: any, item: any) => (
                      // NOTE: don't use `label` here — RSuite swaps it for a
                      // highlighted React node while the search box has text,
                      // which is what produced "[object Object]" during search.
                      // Always read the raw string straight from `item`.
                      <Translate>
                        {formatEnumString(String(item?.[primaryLabelKey] ?? ''))}
                      </Translate>
                    )
                    : (label: any, item: any) => (
                      <Translate>
                        {String(item?.[primaryLabelKey] ?? '')}
                      </Translate>
                    ))
              }
              renderValue={
                isArrayLabel
                  ? (
                    value,
                    item,
                    selectedElement
                  ) => {
                    if (!item) {
                      return selectedElement;
                    }

                    const label = buildCombinedLabel(
                      item,
                      labelKeys,
                      selectedElement
                    );

                    return (
                      <span>
                        <Translate>{label}</Translate>
                      </span>
                    );
                  }
                  : props.isEnum
                    ? (
                      value,
                      item,
                      selectedElement
                    ) => {
                      const base =
                        (item &&
                          item[primaryLabelKey]) ||
                        selectedElement ||
                        value ||
                        '';

                      return (
                        <span>
                          <Translate>
                            {formatEnumString(
                              String(base)
                            )}
                          </Translate>
                        </span>
                      );
                    }
                    : (
                      value,
                      item,
                      selectedElement
                    ) => {
                      const base =
                        (item &&
                          item[primaryLabelKey]) ??
                        selectedElement ??
                        value ??
                        '';

                      return (
                        <span>
                          <Translate>
                            {String(base)}
                          </Translate>
                        </span>
                      );
                    }
              }
              placeholder={props.placeholder}
              cleanable={
                props.cleanable !== undefined
                  ? props.cleanable
                  : true
              }
              loading={props?.loading ?? false}
              onOpen={() => {
                selectOpenGuardRef.current = Date.now();
                focusPickerSearch();
              }}
              onClose={() => {
                setLocalSearch('');
              }}
              placement={props.placement ?? 'bottomStart'}
              preventOverflow={false}
              container={() => document.body}
              menuMaxHeight={getDynamicMenuMaxHeight(
                dataList
              )}
              menuStyle={{
                minWidth: props?.width ?? '12vw',
                width: 'auto',
                zIndex: 100050
              }}
              menuClassName={clsx(
                'my-input-select-menu',
                props.menuClassName
              )}
virtualized={shouldVirtualizePicker(dataList.length)}
              disabledItemValues={getDisabledValues(
                dataList,
                valueKey
              )}
            />
          </div>
        );
      }

      case 'selectPagination': {
        const isArrayLabel = Array.isArray(props.selectDataLabel);
        const isServerSideSearch = Boolean(props.setSearchKeyWard);

        const labelKeys = isArrayLabel
          ? (props.selectDataLabel as string[])
          : [props.selectDataLabel ?? 'name'];

        const primaryLabelKey = labelKeys[0] ?? 'name';
        const valueKey = props.selectDataValue ?? 'id';
        const dataList = props.selectData ?? [];
        const pickerSearchBy = resolvePickerSearchBy(
          labelKeys,
          isArrayLabel,
          props.isEnum,
          isServerSideSearch
        );
        const searchTerm = isServerSideSearch
          ? String(props.searchKeyWard ?? '')
          : localSearch;

        const filteredData = isServerSideSearch
          ? dataList
          : !localSearch
            ? dataList
            : dataList.filter(item => pickerSearchBy(localSearch, '', item));

        const shouldAutoLoadSearch =
          isPickerSearchable &&
          isServerSideSearch &&
          Boolean(String(searchTerm).trim());

        const pickerData = [
          ...filteredData,
          ...(props.hasMore && !shouldAutoLoadSearch
            ? [
              {
                [valueKey]: '__load_more__',
                [primaryLabelKey]: 'Load more...',
                isLoadMore: true
              }
            ]
            : [])
        ];

        return (
          <div ref={pickerRef}>
            <Form.Control
              name={fieldName}
              style={{
                width: props?.width ?? 145,
                height: props?.height ?? 30
              }}
              className={`arrow-number-style my-input ${inputColor ? `input-${inputColor}` : ''
                }`}
              block={props?.width === '100%'}
              disabled={props.disabled}
              accepter={SelectPicker}
              searchable={isPickerSearchable}
              data={pickerData}
              labelKey={primaryLabelKey}
              valueKey={valueKey}
              searchBy={pickerSearchBy}
              onSearch={(keyword: string) => {
                if (isServerSideSearch && props.setSearchKeyWard) {
                  props.setSearchKeyWard(keyword);
                  return;
                }
                setLocalSearch(keyword);
              }}
              value={
                record?.[fieldName] !== undefined && record?.[fieldName] !== null
                  ? record[fieldName]
                  : null
              }
              onChange={(value, item, event) => {
                if (item?.isLoadMore || value === '__load_more__') {
                  event?.preventDefault?.();
                  event?.stopPropagation?.();

                  loadMoreClickedRef.current = true;
                  props.onFetchMore?.();

                  setTimeout(() => {
                    setIsSelectOpen(true);
                  }, 0);

                  return;
                }

                handleValueChange(value);

                if (props.onSelectItem) {
                  const selectedItem =
                    dataList.find((x: any) => String(x?.[valueKey]) === String(value)) ??
                    item ??
                    null;

                  props.onSelectItem(selectedItem);
                }
              }}
              onKeyDown={
                isPickerSearchable
                  ? undefined
                  : (event: any) => {
                const key = event?.key;
                if (!key) return;

                const ignoredKeys = [
                  'Shift',
                  'Tab',
                  'Enter',
                  'Escape',
                  'ArrowUp',
                  'ArrowDown',
                  'ArrowLeft',
                  'ArrowRight',
                  'Control',
                  'Alt',
                  'Meta'
                ];

                if (ignoredKeys.includes(key)) return;

                if (key === 'Backspace') {
                  if (isServerSideSearch && props.setSearchKeyWard) {
                    props.setSearchKeyWard(String(props.searchKeyWard ?? '').slice(0, -1));
                  } else {
                    setLocalSearch(prev => prev.slice(0, -1));
                  }
                  return;
                }

                if (key.length === 1) {
                  if (isServerSideSearch && props.setSearchKeyWard) {
                    props.setSearchKeyWard(
                      String(props.searchKeyWard ?? '') + key
                    );
                  } else {
                    setLocalSearch(prev => prev + key);
                  }
                }
              }
              }
              renderMenuItem={
                props.renderMenuItem ??
                ((label: any, item: any) => {
                  if (item?.isLoadMore) {
                    return <span style={{ fontWeight: 600 }}>Load more...</span>;
                  }

                  if (isArrayLabel) {
                    return (
                      <Translate>
                        {buildCombinedLabel(item, labelKeys, label)}
                      </Translate>
                    );
                  }

                  if (props.isEnum) {
                    // NOTE: don't use `label` here — RSuite swaps it for a
                    // highlighted React node while the search box has text,
                    // which is what produced "[object Object]" during search.
                    // Always read the raw string straight from `item`.
                    return (
                      <Translate>
                        {formatEnumString(String(item?.[primaryLabelKey] ?? ''))}
                      </Translate>
                    );
                  }

                  return <Translate>{String(item?.[primaryLabelKey] ?? '')}</Translate>;
                })
              }
              renderValue={
                isArrayLabel
                  ? (value, item, selectedElement) => {
                    if (!item) return selectedElement;

                    return (
                      <span>
                        <Translate>
                          {buildCombinedLabel(item, labelKeys, selectedElement)}
                        </Translate>
                      </span>
                    );
                  }
                  : props.isEnum
                    ? (value, item, selectedElement) => {
                      const base =
                        (item && item[primaryLabelKey]) ||
                        selectedElement ||
                        value ||
                        '';

                      return (
                        <span>
                          <Translate>{formatEnumString(String(base))}</Translate>
                        </span>
                      );
                    }
                    : (value, item, selectedElement) => {
                      const base =
                        (item && item[primaryLabelKey]) ??
                        selectedElement ??
                        value ??
                        '';

                      return (
                        <span>
                          <Translate>{String(base)}</Translate>
                        </span>
                      );
                    }
              }
              placeholder={searchTerm ? `Search: ${searchTerm}` : props.placeholder}
              cleanable={props.cleanable !== undefined ? props.cleanable : true}
              loading={props.loading ?? false}
              open={isSelectOpen}
              onOpen={() => {
                selectOpenGuardRef.current = Date.now();
                setPlacement(calculatePlacement());
                setIsSelectOpen(true);
                focusPickerSearch();
              }}
              onClose={() => {
                if (loadMoreClickedRef.current) {
                  loadMoreClickedRef.current = false;
                  setIsSelectOpen(true);
                  return;
                }

                setIsSelectOpen(false);
                if (isServerSideSearch && props.setSearchKeyWard) {
                  props.setSearchKeyWard('');
                } else {
                  setLocalSearch('');
                }
              }}
              placement={placement}
              preventOverflow={pickerPreventOverflow}
              container={resolveContainer()}
              menuMaxHeight={getDynamicMenuMaxHeight(pickerData)}
              menuStyle={{
                minWidth: props?.width ?? '12vw',
                width: 'auto'
              }}
              virtualized={shouldVirtualizePicker(pickerData.length)}
              disabledItemValues={getDisabledValues(dataList, valueKey)}
            />
          </div>
        );
      }

      case 'multyPicker': {
        const dataList = props?.selectData ?? [];
        const valueKey = props?.selectDataValue ?? '';
        const pickerSearchBy = resolvePickerSearchBy(
          [String(props?.selectDataLabel ?? 'name')],
          false,
          props.isEnum
        );

        return (
          <div ref={pickerRef}>
            <Form.Control
              style={{ width: props?.width ?? 145, height: props?.height ?? 30 }}
              block
              disabled={props.disabled}
              accepter={TagPicker}
              container={resolveContainer()}
              placement={placement}
              preventOverflow={pickerPreventOverflow}
              name={fieldName}
              data={dataList}
              labelKey={props?.selectDataLabel ?? ''}
              valueKey={valueKey}
              value={record ? record[fieldName] : []}
              onChange={handleValueChange}
              placeholder={props.placeholder ?? 'Select...'}
              creatable={props.creatable ?? false}
              groupBy={props.groupBy ?? null}
              searchable={isPickerSearchable}
              searchBy={pickerSearchBy}
              renderMenuItem={
                props.renderMenuItem ??
                ((label: any, item: any) => (
                  <Translate>{String(item?.[props?.selectDataLabel ?? ''] ?? '')}</Translate>
                ))
              }
              menuMaxHeight={getDynamicMenuMaxHeight(dataList)}
              onKeyDown={focusNextField}
              open={isMultyPickerOpen}
              onOpen={() => {
                setPlacement(calculatePlacement());
                setIsMultyPickerOpen(true);
                focusPickerSearch();
              }}
              onClose={() => setIsMultyPickerOpen(false)}
              disabledItemValues={getDisabledValues(dataList, valueKey)}
            />
          </div>
        );
      }
      case 'color':
        return (
          <input
            type="color"
            value={record?.[fieldName] || '#1976d2'}
            onChange={(e) =>
              setRecord({
                ...record,
                [fieldName]: e.target.value
              })
            }
          />
        );
      case 'checkPicker': {
        const isArrayLabel = Array.isArray(props.selectDataLabel);

        const labelKeys = isArrayLabel
          ? (props.selectDataLabel as string[])
          : [props.selectDataLabel ?? 'label'];

        const primaryLabelKey = labelKeys[0] ?? 'label';
        const valueKey = props?.selectDataValue ?? 'value';
        const dataList = props?.selectData ?? [];
        const pickerSearchBy = resolvePickerSearchBy(
          labelKeys,
          isArrayLabel,
          props.isEnum
        );

        return (
          <div ref={pickerRef}>
            <Form.Control
              style={{
                width: props?.width ?? 145,
                height: props?.height ?? 30
              }}
              className={`arrow-number-style my-input ${inputColor ? `input-${inputColor}` : ''
                }`}
              block={props?.width === '100%'}
              disabled={props.disabled}
              accepter={CheckPicker}
              searchable={isPickerSearchable}
              searchBy={pickerSearchBy}
              container={resolveContainer()}
              placement={placement}
              preventOverflow={pickerPreventOverflow}
              name={fieldName}
              data={dataList}
              labelKey={primaryLabelKey}
              valueKey={valueKey}
              menuClassName={clsx(
                'my-input-picker-popup',
                props?.menuClassName
              )}
              value={Array.isArray(record?.[fieldName]) ? record[fieldName] : []}
              renderMenuItem={
                props.renderMenuItem ??
                ((label: any, item: any) => {
                  if (isArrayLabel) {
                    return (
                      <Translate>
                        {buildCombinedLabel(item, labelKeys, label)}
                      </Translate>
                    );
                  }

                  if (props.isEnum) {
                    return (
                      <Translate>
                        {formatEnumString(String(item?.[primaryLabelKey] ?? ''))}
                      </Translate>
                    );
                  }

                  return <Translate>{String(item?.[primaryLabelKey] ?? '')}</Translate>;
                })
              }
              onChange={value => {
                handleValueChange(value);

                if (props.onSelectItem) {
                  const selectedItems = (props?.selectData ?? []).filter(item =>
                    (value ?? []).some(
                      v => String(v) === String(item?.[valueKey])
                    )
                  );

                  props.onSelectItem(selectedItems);
                }
              }}
              placeholder={props.placeholder ?? 'Select...'}
              groupBy={props.groupBy ?? null}
              menuMaxHeight={getDynamicMenuMaxHeight(dataList)}
              open={isCheckPickerOpen}
              onOpen={() => {
                setPlacement(calculatePlacement());
                setIsCheckPickerOpen(true);
                focusPickerSearch();
              }}
              onClose={() => {
                setIsCheckPickerOpen(false);
                setLocalSearch('');
              }}
              menuStyle={{
                minWidth: props?.width ?? '12vw',
                width: 'auto'
              }}
              virtualized={shouldVirtualizePicker(dataList.length)}
              disabledItemValues={getDisabledValues(dataList, valueKey)}
            />
          </div>
        );
      }

      case 'date': {
        const currentDateText = dateText || formatDateText(record?.[fieldName]);

        return (
          <div
            ref={pickerRef}
            style={{
              position: 'relative',
              width: props?.width ?? 145
            }}
          >
            <DatePicker
              value={
                record?.[fieldName]
                  ? dayjs(record[fieldName]).toDate()
                  : null
              }
              minDate={props.minDate}
              maxDate={props.maxDate}
              onChange={(value: Date | null) => {
                if (!value) {
                  setDateText('');

                  setRecord?.({
                    ...record,
                    [fieldName]: null
                  });

                  return;
                }

                const formatted = dayjs(value).format('DD-MM-YYYY');

                setDateText(formatted);

                setRecord?.({
                  ...record,
                  [fieldName]: dayjs(value).format('YYYY-MM-DD')
                });

                setIsDateOpen(false);
              }}
              format="dd-MM-yyyy"
              cleanable={false}
              editable={false}

              menuClassName={clsx(
                'my-input-calendar-popup',
                props?.menuClassName
              )}

              open={isDateOpen}
              onOpen={() => {
                dateOpenGuardRef.current = Date.now();
              }}
              onClose={() => undefined}
              placement={placement}
              preventOverflow={false}
              container={() => document.body}
              shouldDisableDate={(date: Date) => {
                const currentDate = new Date(date);
                currentDate.setHours(0, 0, 0, 0);

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const minYearDate = new Date(1900, 0, 1);
                minYearDate.setHours(0, 0, 0, 0);

                if (currentDate < minYearDate) {
                  return true;
                }

                if (props.minDate) {
                  const minDate = new Date(props.minDate);
                  minDate.setHours(0, 0, 0, 0);

                  if (currentDate < minDate) {
                    return true;
                  }
                }

                if (props.maxDate) {
                  const maxDate = new Date(props.maxDate);
                  maxDate.setHours(0, 0, 0, 0);

                  if (currentDate > maxDate) {
                    return true;
                  }
                }

                if (props.disablePastDates && currentDate < today) {
                  return true;
                }

                if (props.disableFutureDates && currentDate > today) {
                  return true;
                }

                return false;
              }}
              className="my-input-date-trigger"
              style={getCalendarTriggerStyle('date')}
            />

            <div
              className="custom-date-input rs-picker"
              style={{
                width: props?.width ?? 145,
                height: props?.height ?? 30,
                position: 'relative'
              }}
            >
              <input
                ref={dateTextRef}
                type="text"
                name={fieldName}
                disabled={props.disabled}
                value={currentDateText}
                placeholder={props.placeholder ?? 'DD-MM-YYYY'}
                className={`rs-input my-input ${inputColor ? `input-${inputColor}` : ''
                  }`}
                style={{
                  width: '100%',
                  height: '100%',
                  paddingRight: 38,
                  cursor: props.disabled ? 'not-allowed' : 'text'
                }}
                onChange={() => {
                }}
                onFocus={() => {
                  if (!props.disabled) {
                    setPlacement(calculatePlacement(360));
                  }
                }}
                onClick={() => {
                  openCalendar('date');
                }}
onBlur={() => {
  const value = dateTextRef.current?.value || '';
  const parsed = getDateFromText(value);

  if (parsed) {
    const recordValue = parsed.toDate();
    recordValue.setHours(0, 0, 0, 0);

    if (props.minDate) {
      const minDate = new Date(props.minDate);
      minDate.setHours(0, 0, 0, 0);

      if (recordValue < minDate) {
        dispatch(
          notify({
            msg: 'Date cannot be earlier than the allowed date',
            sev: 'warning'
          })
        );

        setDateText(formatDateText(record?.[fieldName]));
        return;
      }
    }

    if (props.maxDate) {
      const maxDate = new Date(props.maxDate);
      maxDate.setHours(0, 0, 0, 0);

      if (recordValue > maxDate) {
        dispatch(
          notify({
            msg: 'Date cannot be later than the allowed date',
            sev: 'warning'
          })
        );

        setDateText(formatDateText(record?.[fieldName]));
        return;
      }
    }

    setRecord?.({
      ...record,
      [fieldName]: parsed.format('YYYY-MM-DD')
    });
  }

  const recordValue = parsed
    ? parsed.toDate()
    : record?.[fieldName]
      ? new Date(record[fieldName])
      : null;

  if (!recordValue) return;

  const minDate = new Date(1900, 0, 1);
  const today = new Date(
    new Date().setHours(0, 0, 0, 0)
  );

  if (
    props.showWarningIfBeforeYear1900 &&
    recordValue < minDate
  ) {
    dispatch(
      notify({
        msg: 'Date cannot be earlier than 1900',
        sev: 'warning'
      })
    );
    return;
  }

  if (
    props.showWarningIfInPast &&
    recordValue < today
  ) {
    dispatch(
      notify({
        msg: 'Date is in the past',
        sev: 'warning'
      })
    );
  }
}}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  const input = e.currentTarget;

                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setIsDateOpen(false);
                    focusNextField(e);
                    return;
                  }

                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsDateOpen(false);
                    return;
                  }

                  if (
                    e.ctrlKey &&
                    e.key.toLowerCase() === 'a'
                  ) {
                    e.preventDefault();

                    input.setSelectionRange(0, 10);

                    return;
                  }

                  if (
                    e.key === 'ArrowLeft' ||
                    e.key === 'ArrowRight'
                  ) {
                    e.preventDefault();

                    const current =
                      input.selectionStart ?? 0;

                    let next =
                      e.key === 'ArrowRight'
                        ? current + 1
                        : current - 1;

                    if (
                      next === 2 ||
                      next === 5
                    ) {
                      next += e.key === 'ArrowRight' ? 1 : -1;
                    }

                    next = Math.max(
                      0,
                      Math.min(10, next)
                    );

                    input.setSelectionRange(
                      next,
                      next
                    );

                    return;
                  }

                  if (e.key === 'Tab') {
                    return;
                  }

                  if (e.key === 'Backspace') {
                    e.preventDefault();

                    const value =
                      input.value || '01-01-2000';

                    let position =
                      input.selectionStart ?? 0;

                    if (
                      input.selectionStart !==
                      input.selectionEnd
                    ) {
                      const start =
                        input.selectionStart ?? 0;

                      const end =
                        input.selectionEnd ?? start;

                      const chars =
                        value.split('');

                      for (
                        let i = start;
                        i < end;
                        i++
                      ) {
                        if (chars[i] !== '-') {
                          chars[i] = '0';
                        }
                      }

                      const newValue =
                        chars.join('');

                      setDateText(newValue);

                      setTimeout(() => {
                        input.setSelectionRange(
                          start,
                          start
                        );
                      }, 0);

                      return;
                    }

                    if (position <= 0) return;

                    let deletePosition =
                      position - 1;
                    if (
                      value[deletePosition] === '-'
                    ) {
                      deletePosition--;
                    }

                    if (deletePosition < 0) {
                      return;
                    }

                    const chars =
                      value.split('');

                    chars[deletePosition] = '0';

                    const newValue =
                      chars.join('');

                    setDateText(newValue);

                    setTimeout(() => {
                      input.setSelectionRange(
                        deletePosition,
                        deletePosition
                      );
                    }, 0);

                    return;
                  }

                  if (e.key === 'Delete') {
                    e.preventDefault();

                    const value =
                      input.value || '01-01-2000';

                    const position =
                      input.selectionStart ?? 0;

                    if (position >= 10) return;

                    let deletePosition =
                      position;

                    if (
                      value[deletePosition] === '-'
                    ) {
                      deletePosition++;
                    }

                    if (deletePosition >= 10) {
                      return;
                    }

                    const chars =
                      value.split('');

                    chars[deletePosition] = '0';

                    const newValue =
                      chars.join('');

                    setDateText(newValue);

                    setTimeout(() => {
                      input.setSelectionRange(
                        deletePosition,
                        deletePosition
                      );
                    }, 0);

                    return;
                  }

                  /*
                  * NUMBERS
                  */
                  if (/^\d$/.test(e.key)) {
                    e.preventDefault();

                    const value =
                      input.value || '01-01-2000';

                    let position =
                      input.selectionStart ?? 0;

                    const selectionStart =
                      input.selectionStart ?? 0;

                    const selectionEnd =
                      input.selectionEnd ?? 0;

                    if (position <= 1) {
                      const chars =
                        value.split('');

                      chars[position] = e.key;

                      const newValue =
                        chars.join('');

                      setDateText(newValue);

                      const next =
                        position === 1
                          ? 3
                          : 1;

                      setTimeout(() => {
                        input.setSelectionRange(
                          next,
                          next
                        );
                      }, 0);

                      return;
                    }

                    if (
                      position >= 3 &&
                      position <= 4
                    ) {
                      const chars =
                        value.split('');

                      chars[position] = e.key;

                      const newValue =
                        chars.join('');

                      setDateText(newValue);

                      const next =
                        position === 4
                          ? 6
                          : 4;

                      setTimeout(() => {
                        input.setSelectionRange(
                          next,
                          next
                        );
                      }, 0);

                      return;
                    }

                    if (
                      position >= 6 &&
                      position <= 9
                    ) {
                      e.stopPropagation();

                      let year =
                        value.substring(6, 10);
                      if (
                        position === 6 ||
                        selectionEnd === 10
                      ) {
                        year = `${e.key}000`;
                        position = 6;
                      } else {
                        const yearChars =
                          year.split('');

                        yearChars[
                          position - 6
                        ] = e.key;

                        year =
                          yearChars.join('');
                      }

                      const newValue =
                        value.substring(0, 6) +
                        year;

                      setDateText(newValue);

                      const next =
                        Math.min(
                          position + 1,
                          10
                        );

                      setTimeout(() => {
                        input.setSelectionRange(
                          next,
                          next
                        );
                      }, 0);

                      return;
                    }
                  }
                }}
              />
              <button
                type="button"
                disabled={props.disabled}
                tabIndex={-1}
                onMouseDown={e => {
                  e.preventDefault();
                }}
                onClick={() => {
                  if (props.disabled) return;
                  if (isDateOpen) {
                    setIsDateOpen(false);
                    return;
                  }
                  openCalendar('date');
                }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  height: '100%',
                  width: 36,
                  border: 'none',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: props.disabled
                    ? 'not-allowed'
                    : 'pointer',
                  color: '#8c8c8c'
                }}
              >
                <MdCalendarToday size={16} />
              </button>
            </div>
          </div>
        );
      }

      case 'number': {
        const numInputWidth = props?.width ?? 145;
        const addonWidth = 40;

        const calculateTextWidth = (text: any) => {
          if (!text) return addonWidth;
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          context.font =
            '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial';
          const metrics = context.measureText(text.toString());
          return Math.ceil(metrics.width) + 18;
        };

        const totalWidth =
          numInputWidth +
          (rightAddon
            ? rightAddonwidth === 'auto'
              ? calculateTextWidth(rightAddon)
              : rightAddonwidth ?? addonWidth
            : 0) +
          (rightAddon ? 2 : 0);

        const value =
          record?.[fieldName] === 0
            ? props.showZero
              ? '0'
              : ''
            : record?.[fieldName] !== null && record?.[fieldName] !== undefined
              ? String(record[fieldName])
              : '';

        const inputControl = props.allowDecimal ? (
          <Form.Control
            className={`arrow-number-style ${inputColor ? `input-${inputColor}` : ''}`}
            style={{
              width: numInputWidth,
              height: props?.height ?? 30,
              minWidth: numInputWidth,
              maxWidth: numInputWidth,
              flexShrink: 0,
              paddingRight: rightAddon ? '2px' : undefined
            }}
            disabled={props.disabled}
            name={fieldName}
            accepter={Input}
            type="text"
            inputMode="decimal"
            value={value}
            placeholder={props.placeholder}
            onChange={(value: string) => {
              if (value === '' || value === null || value === undefined) {
                setRecord?.({ ...record, [fieldName]: '' });
                return;
              }

              let normalized = value.replace(',', '.');
              normalized = normalized.replace(/[^0-9.]/g, '');

              const digitsOnly = normalized.replace('.', '');
              if (digitsOnly.length > 10) {
                const trimmed = digitsOnly.slice(0, 10);
                normalized = normalized.includes('.')
                  ? trimmed.slice(0, normalized.indexOf('.')) +
                  '.' +
                  trimmed.slice(normalized.indexOf('.'))
                  : trimmed;

                dispatch(notify({ msg: 'Maximum allowed is 10 digits', sev: 'warning' }));
              }

              const firstDotIndex = normalized.indexOf('.');
              if (firstDotIndex !== -1) {
                normalized =
                  normalized.slice(0, firstDotIndex + 1) +
                  normalized.slice(firstDotIndex + 1).replace(/\./g, '');
              }

              setRecord?.({ ...record, [fieldName]: normalized });
            }}
            onBlur={() => {
              const currentValue = record?.[fieldName];
              if (currentValue === '' || currentValue === null || currentValue === undefined) {
                setRecord?.({ ...record, [fieldName]: null });
                return;
              }
              const normalized = String(currentValue).replace(',', '.').trim();
              const numericValue = Number(normalized);
              setRecord?.({
                ...record,
                [fieldName]: Number.isNaN(numericValue) ? null : numericValue
              });
            }}
            onKeyDown={focusNextField}
          />
        ) : (
          <Form.Control
            className={`arrow-number-style ${inputColor ? `input-${inputColor}` : ''}`}
            style={{
              width: numInputWidth,
              height: props?.height ?? 30,
              minWidth: numInputWidth,
              maxWidth: numInputWidth,
              flexShrink: 0,
              paddingRight: rightAddon ? '2px' : undefined
            }}
            disabled={props.disabled}
            name={fieldName}
            max={props.max}
            min={props.min ?? 0}
            step={props.step ?? 1}
            accepter={InputNumber}
            value={value}
            onChange={value => {
              if (value === '' || value === null || value === undefined) {
                setRecord?.({ ...record, [fieldName]: null });
                return;
              }

              let numericValue = typeof value === 'number' ? value : Number(value);

              if (!Number.isNaN(numericValue)) {
                const stringValue = String(Math.trunc(numericValue));
                if (stringValue.length > 10) {
                  numericValue = Number(stringValue.slice(0, 10));
                  dispatch(notify({ msg: 'Maximum allowed is 10 digits', sev: 'warning' }));
                }
              }

              setRecord?.({
                ...record,
                [fieldName]: Number.isNaN(numericValue) ? null : Math.trunc(numericValue)
              });
            }}
            placeholder={props.placeholder}
            onKeyDown={focusNextField}
          />
        );

        if (leftAddon || rightAddon) {
          return (
            <InputGroup style={{ width: totalWidth }}>
              {leftAddon && (
                <InputGroup.Addon
                  className="my-input-addon"
                  style={{
                    width:
                      leftAddonwidth === 'auto'
                        ? calculateTextWidth(leftAddon)
                        : leftAddonwidth ?? addonWidth,
                    minWidth:
                      leftAddonwidth === 'auto'
                        ? calculateTextWidth(leftAddon)
                        : leftAddonwidth ?? addonWidth
                  }}
                >
                  {leftAddon}
                </InputGroup.Addon>
              )}
              {inputControl}
              {rightAddon && (
                <InputGroup.Addon
                  className="my-input-addon"
                  style={{
                    width:
                      rightAddonwidth === 'auto'
                        ? calculateTextWidth(rightAddon)
                        : rightAddonwidth ?? addonWidth,
                    minWidth:
                      rightAddonwidth === 'auto'
                        ? calculateTextWidth(rightAddon)
                        : rightAddonwidth ?? addonWidth
                  }}
                >
                  {rightAddon}
                </InputGroup.Addon>
              )}
            </InputGroup>
          );
        }

        return inputControl;
      }

      case 'check':
        return (
          <Checkbox
            checked={record[fieldName] ?? false}
            onChange={(_, checked) => handleValueChange(checked)}
            disabled={props.disabled}
          >
            <Translate>{props.label ? props.label : fieldLabel}</Translate>
          </Checkbox>
        );

      case 'textnumber': {
        const defaultInputWidth = props?.width ?? 145;
        return (
          <Form.Control
            style={{ width: defaultInputWidth, height: props?.height ?? 30 }}
            disabled={props.disabled}
            name={fieldName}
            type="text"
            inputMode="numeric"
            value={record?.[fieldName] ?? ''}
            placeholder={props.placeholder}
            onChange={(value: string) => {
              const numericOnly = value.replace(/[^0-9]/g, '');
              setRecord?.({ ...record, [fieldName]: numericOnly });
            }}
            onKeyDown={focusNextField}
          />
        );
      }

      default: {
        const defaultInputWidth = props?.width ?? 145;
        const addonWidth = 40;
        const totalWidth =
          defaultInputWidth +
          (leftAddon ? (leftAddonwidth ? leftAddonwidth : addonWidth) : 0) +
          (rightAddon ? (rightAddonwidth ? rightAddonwidth : addonWidth) : 0);

        const rawValue = record ? record[fieldName] : '';
        const formattedValue =
          props.isEnum && typeof rawValue === 'string' ? formatEnumString(rawValue) : rawValue;
        const displayValue = formattedValue ?? '';

        const isPassword = fieldType === 'password';

        const inputControl = isPassword ? (
          <InputGroup inside style={{ width: defaultInputWidth }}>
            <Form.Control
              style={{ width: '100%', height: props?.height ?? 30 }}
              disabled={props.disabled}
              name={fieldName}
              type={showPassword ? 'text' : 'password'}
              value={displayValue}
              onChange={handleValueChange}
              placeholder={props.placeholder}
              onKeyDown={async e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const result = await props.enterClick?.();
                  if (result !== false) {
                    focusNextField(e);
                  }
                }
              }}
            />
            {!props.disabled && (
              <InputGroup.Button
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-button"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  padding: '8px 12px',
                  outline: 'none'
                }}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </InputGroup.Button>
            )}
          </InputGroup>
        ) : (
          <div style={{ position: 'relative', display: 'inline-block', width: defaultInputWidth }}>
            <Form.Control
              style={{ width: '100%', height: props?.height ?? 30, paddingRight: '35px' }}
              disabled={props.disabled}
              name={fieldName}
              type={fieldType}
              value={displayValue}
              onChange={handleValueChange}
              placeholder={props.placeholder}
              onKeyDown={async e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const result = await props.enterClick?.();
                  if (result !== false) {
                    focusNextField(e);
                  }
                }
              }}
            />
            {recording && <span className="pulse-ring"></span>}
          </div>
        );

        if (leftAddon || rightAddon) {
          return (
            <InputGroup style={{ width: totalWidth }}>
              {leftAddon && (
                <InputGroup.Addon style={{ width: addonWidth, textAlign: 'center' }}>
                  {leftAddon}
                </InputGroup.Addon>
              )}
              {inputControl}
              {rightAddon && (
                <InputGroup.Addon style={{ width: addonWidth, textAlign: 'center' }}>
                  {rightAddon}
                </InputGroup.Addon>
              )}
            </InputGroup>
          );
        }

        return inputControl;
      }
    }
  };


  return (
    <Form.Group
      className={clsx(`my-input-container ${className} ${mode == 'light' ? 'light' : 'dark'}`)}
    >
      <Form.ControlLabel>
        {showLabel && (
          <MyLabel
            label={
              typeof fieldLabel === 'string' ? <Translate>{fieldLabel}</Translate> : fieldLabel
            }
            error={validationResult}
            color={mode === 'light' ? 'var(--black)' : 'var(--white)'}
          />
        )}
        {props.required && <span className="required-field">*</span>}
      </Form.ControlLabel>
      {props.column && <div style={{ marginBottom: 5 }} />}
      {conjureFormControl()}
    </Form.Group>
  );
};

export default MyInput;