import { camelCaseToLabel, fromCamelCaseToDBName, formatEnumString } from '@/utils';
import React, { useEffect, useState, useRef } from 'react';
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
    // menuClassName={clsx('my-input-calendar-popup', props?.menuClassName)}
  />
));

const CustomDateTimePicker = React.forwardRef((props: any, ref: any) => (
  <DatePicker
    {...props}
    format="dd-MM-yyyy HH:mm"
    cleanable={false}
    block
    ref={ref}
    // menuClassName={clsx('my-input-calendar-popup', props?.menuClassName)}
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
  | 'textnumber';
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
  hasMore?: boolean;
  onFetchMore?: () => void;
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
  disableFutureDates?: boolean;
  showWarningIfBeforeYear1900?: boolean;
  showWarningIfInPast?: boolean;
  min?: number;
  step?: number;
  allowDecimal?: boolean;
  disabledItemValues?: boolean;
  disableByField?: string;
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
  const loadMoreClickedRef = useRef(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isDateTimeOpen, setIsDateTimeOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isMultyPickerOpen, setIsMultyPickerOpen] = useState(false);
  const [isCheckPickerOpen, setIsCheckPickerOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localSearch, setLocalSearch] = useState('');


  const allowEnterNewLine = props.allowEnterNewLine ?? true;

  useEffect(() => {
    const handleScroll = event => {
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
  }, []);

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

  const fieldLabel = props?.fieldLabel ?? camelCaseToLabel(fieldName);

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
    return Math.min(capHeight, itemsCount * estimatedItemHeight + headerAllowance);
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

  const [placement, setPlacement] = useState<'topStart' | 'bottomStart'>('bottomStart');

  const pickerRef = useRef<any>(null);

  const calculatePlacement = () => {
    if (!pickerRef.current) return 'bottomStart';
    const rect = pickerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    return spaceBelow > 250 ? 'bottomStart' : 'topStart';
  };

  const resolveContainer = () => {
    const pickerElement = pickerRef.current as HTMLElement | null;

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

  const buildCombinedLabel = (item: any, labelKeys: string[], fallback: any) => {
    if (!item || !labelKeys?.length) return fallback;
    const parts = labelKeys
      .map(key => (key ? item[key] : undefined))
      .filter(v => v !== undefined && v !== null && v !== '');
    const combined = parts.join(' ').trim();
    return combined || fallback;
  };
  const getDisabledValues = (dataList: any[], valueKey: string) =>
    props.disabledItemValues
      ? dataList.map(item => item[valueKey])
      : props.disableByField
        ? dataList
          .filter(item => item?.[props.disableByField] === false).map(item => item[valueKey])
        : [];
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
            checkedChildren={props.checkedLabel || 'Yes'}
            unCheckedChildren={props.unCheckedLabel || 'No'}
            disabled={props.disabled}
            checked={record[fieldName] == null ? false : !!record[fieldName]}
            onChange={handleValueChange}
            defaultChecked={props.defaultChecked}
            onKeyDown={focusNextField}
          />
        );

      case 'datetime':
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
            value={record[fieldName] ? new Date(record[fieldName]) : null}
            accepter={CustomDateTimePicker}
            onChange={handleValueChange}
            placeholder={props.placeholder}
            onKeyDown={focusNextField}
            open={isDateTimeOpen}
            onOpen={() => {
              setPlacement(calculatePlacement());
              setIsDateTimeOpen(true);
            }}
            onClose={() => setIsDateTimeOpen(false)}
            placement={placement}
            preventOverflow={pickerPreventOverflow}
            container={resolveContainer()}
            shouldDisableDate={(date: Date) => {
              const today = new Date(new Date().setHours(0, 0, 0, 0));
              if (props.disablePastDates) return date < today;
              if (props.disableFutureDates) return date > today;
              return false;
            }}
          />
        );

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

        const filteredData = !localSearch
          ? dataList
          : dataList.filter(item => {
            const text = isArrayLabel
              ? buildCombinedLabel(item, labelKeys, '')
              : String(item?.[primaryLabelKey] ?? '');

            return text
              .toLowerCase()
              .includes(localSearch.toLowerCase());
          });

        // 🔥 calculate popup width
        const longestLabel = dataList.reduce(
          (longest, item) => {
            const text = isArrayLabel
              ? buildCombinedLabel(
                item,
                labelKeys,
                ''
              )
              : String(
                item?.[primaryLabelKey] ?? ''
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

        return (
          <div
            ref={pickerRef}
          >
            <Form.Control
              style={{
                width: props?.width ?? 145,
                height: props?.height ?? 30
              }}
              className={`arrow-number-style my-input ${inputColor ? `input-${inputColor}` : ''
                }`}
              block={props?.width === '100%'}
              disabled={props.disabled}
              accepter={SelectPicker}
              searchable={false}

              data={filteredData}

              labelKey={primaryLabelKey}
              valueKey={valueKey}

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
                        String(x?.[valueKey]) ===
                        String(value)
                    ) ?? null;

                  props.onSelectItem(
                    selectedItem
                  );
                }
              }}
              onKeyDown={(event: any) => {
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

                if (
                  ignoredKeys.includes(key)
                ) {
                  return;
                }

                if (key === 'Backspace') {
                  setLocalSearch(prev =>
                    prev.slice(0, -1)
                  );

                  return;
                }

                if (key.length === 1) {
                  setLocalSearch(
                    prev => prev + key
                  );
                }
              }}

              renderMenuItem={
                props.renderMenuItem ??
                (isArrayLabel
                  ? (
                    label: any,
                    item: any
                  ) =>
                    buildCombinedLabel(
                      item,
                      labelKeys,
                      label
                    )
                  : props.isEnum
                    ? (label: any) =>
                      formatEnumString(
                        String(label)
                      )
                    : undefined)
              }

              renderValue={
                isArrayLabel
                  ? (
                    value,
                    item,
                    selectedElement
                  ) => {
                    if (!item)
                      return selectedElement;

                    return (
                      <span>
                        {buildCombinedLabel(
                          item,
                          labelKeys,
                          selectedElement
                        )}
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
                          item[
                          primaryLabelKey
                          ]) ||
                        selectedElement ||
                        value ||
                        '';

                      return (
                        <span>
                          {formatEnumString(
                            String(base)
                          )}
                        </span>
                      );
                    }
                    : undefined
              }

              placeholder={
                localSearch
                  ? `Search: ${localSearch}`
                  : props.placeholder
              }

              cleanable={
                props.cleanable !== undefined
                  ? props.cleanable
                  : true
              }

              loading={
                props?.loading ?? false
              }

              open={isSelectOpen}

              onOpen={() => {
                setPlacement(
                  calculatePlacement()
                );

                setIsSelectOpen(true);
              }}

              onClose={() => {
                setIsSelectOpen(false);

                setLocalSearch('');
              }}

              placement={placement}

              preventOverflow={
                pickerPreventOverflow
              }

              container={resolveContainer()}

              menuMaxHeight={getDynamicMenuMaxHeight(
                filteredData
              )}

              menuStyle={{
                width: popupWidth
              }}

              virtualized={
                props?.virtualized ?? true
              }

              disabledItemValues={getDisabledValues(dataList, valueKey)}
            />
          </div>
        );
      }

      case 'selectPagination': {
        const isArrayLabel = Array.isArray(props.selectDataLabel);
        const labelKeys = isArrayLabel
          ? (props.selectDataLabel as string[])
          : [props.selectDataLabel ?? 'name'];

        const labelKey = labelKeys[0] ?? 'name';
        const valueKey = props.selectDataValue ?? 'id';
        const pickerValue = record?.[fieldName] ?? '';
        const dataList = props.selectData ?? [];

        return (
          <div ref={pickerRef}>
            <Form.Control
              name={fieldName}
              style={{ width: props?.width ?? 145, height: props?.height ?? 30 }}
              className={`arrow-number-style my-input ${inputColor ? `input-${inputColor}` : ''}`}
              block
              disabled={props.disabled}

              accepter={SelectPicker}
              searchable={true}
              searchBy={(keyword, label, item) => {
                if (!keyword) return true;

                const text = isArrayLabel
                  ? buildCombinedLabel(item, labelKeys, '')
                  : String(item?.[primaryLabelKey] ?? '');

                return text
                  .toLowerCase()
                  .includes(keyword.toLowerCase());
              }}

              data={[
                ...dataList,
                ...(props.hasMore
                  ? [
                    {
                      [valueKey]: '__load_more__',
                      [labelKey]: 'Load more...',
                      isLoadMore: true
                    }
                  ]
                  : [])
              ]}

              labelKey={labelKey}
              valueKey={valueKey}
              value={pickerValue}

              onSearch={(searchText) => {
                props.setSearchKeyWard?.(searchText);
              }}

              onChange={(value, item, event) => {
                if (item?.isLoadMore || value === '__load_more__') {
                  event?.preventDefault?.();
                  event?.stopPropagation?.();
                  loadMoreClickedRef.current = true;
                  props.onFetchMore?.();
                  return;
                }

                if (!value) {
                  handleValueChange(null);
                  props.onSelectItem?.(null);
                  return;
                }

                const selectedItem =
                  dataList.find((x: any) => x[valueKey] === value) ?? item ?? null;

                handleValueChange(value);
                props.onSelectItem?.(selectedItem);
              }}

              placeholder={props.placeholder ?? 'Select...'}
              cleanable
              loading={props.loading ?? false}

              open={isSelectOpen}
              onOpen={() => {
                setPlacement(calculatePlacement());
                setIsSelectOpen(true);
              }}
              onClose={() => {
                if (loadMoreClickedRef.current) {
                  loadMoreClickedRef.current = false;
                  setIsSelectOpen(true);
                  return;
                }
                setIsSelectOpen(false);
              }}

              placement={placement}
              preventOverflow={pickerPreventOverflow}
              container={resolveContainer()}
              disabledItemValues={getDisabledValues(dataList, valueKey)} />
          </div>
        );
      }

      case 'multyPicker':
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
              data={props?.selectData ?? []}
              labelKey={props?.selectDataLabel ?? ''}
              valueKey={props?.selectDataValue ?? ''}
              value={record ? record[fieldName] : []}
              onChange={handleValueChange}
              placeholder={props.placeholder ?? 'Select...'}
              creatable={props.creatable ?? false}
              groupBy={props.groupBy ?? null}
              searchBy={props.searchBy}
              menuMaxHeight={getDynamicMenuMaxHeight(props?.selectData)}
              onKeyDown={focusNextField}
              open={isMultyPickerOpen}
              onOpen={() => {
                setPlacement(calculatePlacement());
                setIsMultyPickerOpen(true);
              }}
              onClose={() => setIsMultyPickerOpen(false)}
              disabledItemValues={getDisabledValues(dataList, valueKey)} />
          </div>
        );

      case 'checkPicker': {
        const isArrayLabel = Array.isArray(props.selectDataLabel);

        const labelKeys = isArrayLabel
          ? (props.selectDataLabel as string[])
          : [props.selectDataLabel ?? 'label'];

        const primaryLabelKey = labelKeys[0] ?? 'label';
        const valueKey = props?.selectDataValue ?? 'value';
        const dataList = props?.selectData ?? [];

        const filteredData = !localSearch
          ? dataList
          : dataList.filter(item => {
            const text = isArrayLabel
              ? buildCombinedLabel(item, labelKeys, '')
              : String(item?.[primaryLabelKey] ?? '');

            return text.toLowerCase().includes(localSearch.toLowerCase());
          });

        const longestLabel = dataList.reduce((longest, item) => {
          const text = isArrayLabel
            ? buildCombinedLabel(item, labelKeys, '')
            : String(item?.[primaryLabelKey] ?? '');

          return text.length > longest.length ? text : longest;
        }, '');

        const popupWidth = Math.max(
          typeof props?.width === 'number' ? props.width : 145,
          longestLabel.length * 9 + 120
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
              searchable={false}
              container={resolveContainer()}
              placement={placement}
              preventOverflow={pickerPreventOverflow}
              name={fieldName}
              data={filteredData}
              labelKey={primaryLabelKey}
              valueKey={valueKey}
              value={record ? record[fieldName] : []}
              onChange={value => {
                handleValueChange(value);

                if (props.onSelectItem) {
                  const selectedItems = (props?.selectData ?? []).filter(item =>
                    (value ?? []).some(v => String(v) === String(item?.[valueKey]))
                  );
                  props.onSelectItem(selectedItems);
                }
              }}
              onKeyDown={(event: any) => {
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

                if (ignoredKeys.includes(key)) {
                  return;
                }

                if (key === 'Backspace') {
                  setLocalSearch(prev => prev.slice(0, -1));
                  return;
                }

                if (key.length === 1) {
                  setLocalSearch(prev => prev + key);
                }
              }}
              placeholder={
                localSearch
                  ? `Search: ${localSearch}`
                  : props.placeholder ?? 'Select...'
              }
              groupBy={props.groupBy ?? null}
              menuMaxHeight={getDynamicMenuMaxHeight(filteredData)}
              open={isCheckPickerOpen}
              onOpen={() => {
                setPlacement(calculatePlacement());
                setIsCheckPickerOpen(true);
              }}
              onClose={() => {
                setIsCheckPickerOpen(false);
                setLocalSearch('');
              }}
              menuStyle={{
                width: popupWidth
              }}
              virtualized={props?.virtualized ?? true}
              disabledItemValues={getDisabledValues(dataList, valueKey)} />
          </div>
        );
      }

      case 'date':
        return (
          <div ref={pickerRef}>
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
              accepter={CustomDatePicker}
              defaultValue={record?.[fieldName] ? dayjs(record[fieldName]).toDate() : null}
              onChange={(value: Date | null) => {
                const dateStr = value ? dayjs(value).format('YYYY-MM-DD') : null;
                setRecord?.({ ...record, [fieldName]: dateStr });
              }}
              onBlur={() => {
                const value = record?.[fieldName];
                const minDate = new Date(1900, 0, 1);
                const today = new Date(new Date().setHours(0, 0, 0, 0));

                if (props.showWarningIfBeforeYear1900 && value && new Date(value) < minDate) {
                  dispatch(notify({ msg: 'Date cannot be before 01-01-1900', sev: 'warning' }));
                  return;
                }

                if (props.showWarningIfInPast && value && new Date(value) < today) {
                  dispatch(notify({ msg: 'Date cannot be in the past', sev: 'warning' }));
                }
              }}
              placeholder={props.placeholder ?? 'DD-MM-YYYY'}
              onKeyDown={(e: any) => {
                const input = e.target as HTMLInputElement;
                if (e.ctrlKey && e.key.toLowerCase() === 'a') {
                  e.preventDefault();
                  setTimeout(() => {
                    input.setSelectionRange(0, 2);
                  }, 0);
                  return;
                }
                focusNextField(e);
              }}
              open={isDateOpen}
              onOpen={() => {
                setPlacement(calculatePlacement());
                setIsDateOpen(true);
              }}
              onClose={() => setIsDateOpen(false)}
              placement={placement}
              preventOverflow={pickerPreventOverflow}
              container={resolveContainer()}
              shouldDisableDate={(date: Date) => {
                const today = new Date(new Date().setHours(0, 0, 0, 0));
                const minDate = new Date(1900, 0, 1);
                if (date < minDate) return true;
                if (props.disablePastDates) return date < today;
                if (props.disableFutureDates) return date > today;
                return false;
              }}
            />
          </div>
        );

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
            {props.label ? props.label : fieldLabel}
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
        const displayValue =
          props.isEnum && typeof rawValue === 'string' ? formatEnumString(rawValue) : rawValue;

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
