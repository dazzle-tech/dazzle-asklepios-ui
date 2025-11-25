import { camelCaseToLabel, fromCamelCaseToDBName } from '@/utils';
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
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch, useAppSelector } from '@/hooks';

const Textarea = React.forwardRef((props, ref: any) => (
  <Input {...props} as="textarea" ref={ref} />
));

const CustomDatePicker = React.forwardRef((props, ref: any) => (
  <DatePicker {...props} oneTap cleanable={false} block ref={ref} />
));

const CustomDateTimePicker = React.forwardRef((props: any, ref: any) => (
  <DatePicker {...props} oneTap format="dd-MM-yyyy HH:mm" cleanable={false} block ref={ref} />
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
    | 'check';
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
  // picker controls (allow override)
  placement?: any;
  preventOverflow?: boolean;
  container?: HTMLElement | (() => HTMLElement);
  // select-related
  selectData?: any[];
  selectDataLabel?: string;
  selectDataValue?: string;
  renderMenuItem?: any;
  searchBy?: any;
  searchable?: boolean;
  cleanable?: boolean;
  readOnly?: boolean;
  loading?: boolean;
  defaultSelectValue?: any;
  virtualized?: boolean;
  menuMaxHeight?: number;
  // selectPagination
  hasMore?: boolean;
  onFetchMore?: () => void;
  // Tag/Check picker
  creatable?: boolean;
  groupBy?: string | null;
  // number
  max?: number;
  defaultChecked?: boolean;
  checkedLabel?: string;
  unCheckedLabel?: string;
  label?: string;
  required?: boolean;
  column?: boolean;
  fieldLabel?: string;
  enterClick?: () => Promise<boolean | void> | boolean | void;
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
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isDateTimeOpen, setIsDateTimeOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isMultyPickerOpen, setIsMultyPickerOpen] = useState(false);
  const [isCheckPickerOpen, setIsCheckPickerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = event => {
      const path = event.composedPath ? event.composedPath() : [];

      const menuClassList = [
        'rs-picker-popup',
        'rs-picker-select-menu',
        'rs-picker-menu',
        'rs-virtual-list',
        'rs-virtual-list-scrollbar',
        'rs-picker-tag-menu'
      ];

      if (path.some(el => menuClassList.some(cls => el?.classList?.contains?.(cls)))) {
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
    if (setRecord && typeof setRecord === 'function') {
      setRecord({ ...record, [fieldName]: value });
    }
  };

  const inputWidth = props?.width ?? 145;
  const styleWidth = typeof inputWidth === 'number' ? `${inputWidth}px` : inputWidth;

  // Default placement/preventOverflow for ALL pickers (can be overridden via props)
  const pickerPlacement = props.placement ?? 'bottomStart';
  const pickerPreventOverflow = props.preventOverflow ?? false;

  const getDynamicMenuMaxHeight = (dataList?: any[]) => {
    if (props?.menuMaxHeight !== undefined && props?.menuMaxHeight !== null) {
      return props.menuMaxHeight as number;
    }
    const itemsCount = dataList?.length ?? 0;
    const estimatedItemHeight = 38; // approx item row height for rsuite pickers
    const headerAllowance = 24; // search header/padding allowance
    const capHeight = 240; // sensible default cap
    return Math.min(capHeight, itemsCount * estimatedItemHeight + headerAllowance);
  };

  // start speech recognition
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
  // stop speech recognition
  const stopListening = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  };

  // change recording state
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

  // Resolve a good container for popups (modal-aware), with user override
  const resolveContainer = () =>
    props.container ??
    (() => {
      const subChildModal = document.querySelector(
        '.sub-child-right-modal .rs-modal-body'
      ) as HTMLElement;
      if (subChildModal) return subChildModal;

      const childModal = document.querySelector('.child-right-modal .rs-modal-body') as HTMLElement;
      if (childModal) return childModal;

      const allModalBodies = document.querySelectorAll('.rs-modal-body');
      if (allModalBodies.length > 0) {
        return allModalBodies[allModalBodies.length - 1] as HTMLElement;
      }
      return document.body;
    });

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
              onKeyDown={focusNextField}
            />
            {!props.disabled && (
              <div
                className={`container-of-search-icon-textarea ${recording ? 'recording' : ''}`}
                onClick={changeRecordingState}
                style={{ position: 'relative' }}
              >
                <FontAwesomeIcon
                  icon={faMicrophone}
                  className={props.disabled ? 'disabled-icon' : 'active-icon'}
                />
                {recording && <span className="pulse-ring"></span>}
              </div>
            )}
          </InputGroup>
        );

      case 'checkbox':
        return (
          <Toggle
            style={{ width: props?.width ?? 145, height: props?.height ?? 30 }}
            checkedChildren={props.checkedLabel || 'Yes'}
            unCheckedChildren={props.unCheckedLabel || 'No'}
            disabled={props.disabled}
            checked={record[fieldName]}
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
            onOpen={() => setIsDateTimeOpen(true)}
            onClose={() => setIsDateTimeOpen(false)}
            placement={pickerPlacement}
            preventOverflow={pickerPreventOverflow}
            container={resolveContainer()}
          />
        );

      case 'time':
        return (
          <Form.Control
            className="custom-time-input"
            style={
              {
                width: props?.width ?? 145,
                '--custom-time-input': `${props?.height ?? 30}px`
              } as React.CSSProperties
            }
            disabled={props.disabled}
            name={fieldName}
            value={record[fieldName] ? record[fieldName] : null}
            accepter={TimePicker}
            onChange={handleValueChange}
            onClean={() => handleValueChange(null)}
            placeholder={props.placeholder}
            format="HH:mm"
            cleanable
            onKeyDown={focusNextField}
            open={isTimeOpen}
            onOpen={() => setIsTimeOpen(true)}
            onClose={() => setIsTimeOpen(false)}
            placement={pickerPlacement}
            preventOverflow={pickerPreventOverflow}
            container={resolveContainer()}
          />
        );

      case 'select':
        return (
          <Form.Control
            style={{ width: styleWidth, height: props?.height ?? 30 }}
            className={`arrow-number-style my-input ${inputColor ? `input-${inputColor}` : ''}`}
            block
            disabled={props.disabled}
            accepter={SelectPicker}
            renderMenuItem={props.renderMenuItem}
            searchBy={props.searchBy}
            container={resolveContainer()}
            placement={pickerPlacement}
            preventOverflow={pickerPreventOverflow}
            searchable={props.searchable !== undefined ? props.searchable : true}
            cleanable={props.cleanable !== undefined ? props.cleanable : true}
            readOnly={props.readOnly !== undefined ? props.readOnly : false}
            name={fieldName}
            data={props?.selectData ?? []}
            labelKey={props?.selectDataLabel ?? ''}
            valueKey={props?.selectDataValue ?? ''}
            value={record ? record[fieldName] : ''}
            onChange={handleValueChange}
            defaultValue={props.defaultSelectValue}
            placeholder={props.placeholder}
            menuMaxHeight={getDynamicMenuMaxHeight(props?.selectData)}
            onKeyDown={focusNextField}
            loading={props?.loading ?? false}
            open={isSelectOpen}
            onOpen={() => setIsSelectOpen(true)}
            onClose={() => setIsSelectOpen(false)}
            virtualized={props?.virtualized ?? true}
          />
        );

      case 'selectPagination': {
        const labelKey = props.selectDataLabel ?? 'name';
        const valueKey = props.selectDataValue ?? 'id';

        return (
          <Form.Control
            name={fieldName}
            style={{ width: styleWidth, height: props?.height ?? 30 }}
            className={`arrow-number-style my-input ${inputColor ? `input-${inputColor}` : ''}`}
            block
            disabled={props.disabled}
            accepter={SelectPicker}
            searchKeyWard={props?.searchKeyWard}
            // setSearchKeyWard={props?.setSearchKeyWard}
            onSearch={searchText => {
              props.setSearchKeyWard?.(searchText);
            }}
            data={[
              ...(props.selectData ?? []),
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
            value={record?.[fieldName] ?? ''}
            onChange={(value, item, event) => {
              if (item?.isLoadMore) {
                event?.preventDefault?.();
                event?.stopPropagation?.();
                props.onFetchMore?.();
              } else {
                handleValueChange(value);
              }
            }}
            renderMenuItem={(label, item) => {
              if (item?.isLoadMore) {
                return (
                  <div
                    style={{
                      textAlign: 'center',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      props.onFetchMore?.();
                    }}
                  >
                    {item[labelKey]}
                  </div>
                );
              }
              return label;
            }}
            placeholder={props.placeholder ?? 'Select...'}
            searchable
            cleanable
            loading={props.loading ?? false}
            menuMaxHeight={props.menuMaxHeight ?? 240}
            open={isSelectOpen}
            onOpen={() => setIsSelectOpen(true)}
            onClose={() => setIsSelectOpen(false)}
            placement={pickerPlacement}
            preventOverflow={pickerPreventOverflow}
            container={resolveContainer()}
          />
        );
      }

      case 'multyPicker':
        return (
          <Form.Control
            style={{ width: props?.width ?? 145, height: props?.height ?? 30 }}
            block
            disabled={props.disabled}
            accepter={TagPicker}
            container={resolveContainer()}
            placement={pickerPlacement}
            preventOverflow={pickerPreventOverflow}
            name={fieldName}
            data={props?.selectData ?? []}
            labelKey={props?.selectDataLabel ?? ''}
            valueKey={props?.selectDataValue ?? ''}
            value={record ? record[fieldName] : []} // Multiple values as array
            onChange={handleValueChange} // Pass handler for multiple value selection
            placeholder={props.placeholder ?? 'Select...'}
            creatable={props.creatable ?? false} // Optional: Allow users to create new tags
            groupBy={props.groupBy ?? null} // Optional: Grouping feature if required
            searchBy={props.searchBy} // Optional: Search function for TagPicker
            menuMaxHeight={getDynamicMenuMaxHeight(props?.selectData)}
            onKeyDown={focusNextField}
            open={isMultyPickerOpen}
            onOpen={() => setIsMultyPickerOpen(true)}
            onClose={() => setIsMultyPickerOpen(false)}
          />
        );

      case 'checkPicker':
        return (
          <Form.Control
            style={{ width: props?.width ?? 145, height: props?.height ?? 30 }}
            block
            disabled={props.disabled}
            accepter={CheckPicker}
            container={resolveContainer()}
            placement={pickerPlacement}
            preventOverflow={pickerPreventOverflow}
            name={fieldName}
            data={props?.selectData ?? []}
            labelKey={props?.selectDataLabel ?? ''}
            valueKey={props?.selectDataValue ?? ''}
            value={record ? record[fieldName] : []} // Multiple values as array
            onChange={handleValueChange} // Pass handler for multiple value selection
            placeholder={props.placeholder ?? 'Select...'}
            groupBy={props.groupBy ?? null} // Optional: Grouping feature if required
            searchBy={props.searchBy} // Optional: Search function for checkPicker
            menuMaxHeight={getDynamicMenuMaxHeight(props?.selectData)}
            onKeyDown={focusNextField}
            open={isCheckPickerOpen}
            onOpen={() => setIsCheckPickerOpen(true)}
            onClose={() => setIsCheckPickerOpen(false)}
          />
        );

      case 'date':
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
            accepter={CustomDatePicker}
            onChange={handleValueChange}
            placeholder={props.placeholder}
            onKeyDown={focusNextField}
            open={isDateOpen}
            onOpen={() => setIsDateOpen(true)}
            onClose={() => setIsDateOpen(false)}
            placement={pickerPlacement}
            preventOverflow={pickerPreventOverflow}
            container={resolveContainer()}
          />
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

        const inputControl = (
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
            max={props.max ? props.max : 1000000}
            min={0}
            value={record[fieldName] ? record[fieldName] : ''}
            accepter={InputNumber}
            onChange={handleValueChange}
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

      default: {
        const defaultInputWidth = props?.width ?? 145;
        const addonWidth = 40;
        const totalWidth =
          defaultInputWidth +
          (leftAddon ? (leftAddonwidth ? leftAddonwidth : addonWidth) : 0) +
          (rightAddon ? (rightAddonwidth ? rightAddonwidth : addonWidth) : 0);

        const inputControl = (
          <div style={{ position: 'relative', display: 'inline-block', width: defaultInputWidth }}>
            <Form.Control
              labelKey={props?.selectDataLabel ?? ''}
              style={{
                width: '100%',
                height: props?.height ?? 30,
                paddingRight: '35px'
              }}
              disabled={props.disabled}
              name={fieldName}
              type={fieldType}
              value={record ? record[fieldName] : ''}
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
              <div
                className={`container-of-search-icon ${recording ? 'recording' : ''}`}
                onClick={changeRecordingState}
              >
                <FontAwesomeIcon
                  icon={faMicrophone}
                  className={props.disabled ? 'disabled-icon' : 'active-icon'}
                />
                {recording && <span className="pulse-ring"></span>}
              </div>
            )}
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

  const conjureValidationMessages = () => {
    if (!validationResult) return null;
    const msgs = [];
    let i = 0;
    for (const vrs of validationResult) {
      msgs.push(
        <Form.HelpText
          key={i++}
          style={{
            color:
              vrs.validationType === 'REJECT'
                ? 'red'
                : vrs.validationType === 'WARN'
                ? 'orange'
                : 'grey'
          }}
        >
          <Translate>{fieldLabel}</Translate> - <Translate>{vrs.message}</Translate>
        </Form.HelpText>
      );
    }
    return msgs;
  };

  return (
    <Form.Group
      className={clsx(`my-input-container ${className} ${mode == 'light' ? 'light' : 'dark'}`)}
    >
      <Form.ControlLabel>
        {showLabel && (
          <MyLabel
            label={fieldLabel}
            error={validationResult}
            color={mode === 'light' ? 'var(--black)' : 'var(--white)'}
          />
        )}
        {props.required && <span className="required-field ">*</span>}
      </Form.ControlLabel>
      {props.column}
      {conjureFormControl()}
      {validationResult && conjureValidationMessages()}
    </Form.Group>
  );
};

export default MyInput;
