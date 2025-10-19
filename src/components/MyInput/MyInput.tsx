import { camelCaseToLabel, fromCamelCaseToDBName } from '@/utils';
import React, { useEffect, useState, ForwardedRef, useRef } from 'react';
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

const CustomDateTimePicker = React.forwardRef((props: any, ref: ForwardedRef<HTMLDivElement>) => (
  <DatePicker {...props} oneTap format="dd-MM-yyyy HH:mm" cleanable={false} block ref={ref} />
));

const handleEnterFocusNext = e => {
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

const focusNextField = e => {
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

const MyInput = ({
  fieldName,
  fieldType = 'text',
  record,
  rightAddonwidth = null,
  rightAddon: rightAddon = null,
  leftAddon: leftAddon = null,
  leftAddonwidth = null,
  setRecord = undefined,
  vr = undefined,
  rows = 1,
  showLabel = true, // form validation result
  className = '',
  ...props
}) => {
  const dispatch = useAppDispatch();
  const uiSlice = useAppSelector(state => state.ui);
  const recognitionRef = useRef(null);
  const [recording, setRecording] = useState(false);
  // <<< Added this line here to fix the error
//  console.log("RECORE",record)
  const inputColor = props.inputColor || record?.inputColor || '';
  const mode = useSelector((state: any) => state.ui.mode);
  const [validationResult, setValidationResult] = useState(undefined);

  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isDateTimeOpen, setIsDateTimeOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isMultyPickerOpen, setIsMultyPickerOpen] = useState(false);
  const [isCheckPickerOpen, setIsCheckPickerOpen] = useState(false);

  useEffect(() => {
    const isAnyOpen =
      isSelectOpen ||
      isDateOpen ||
      isDateTimeOpen ||
      isTimeOpen ||
      isMultyPickerOpen ||
      isCheckPickerOpen;

    if (!isAnyOpen) return;

    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement | null;
      // Ignore scrolls occurring inside rsuite picker menus to allow internal scrolling
      if (
        target &&
        (target.closest('.rs-picker-menu') || target.closest('.rs-picker-select-menu') || target.closest('.rs-virtual-list'))
      ) {
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

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isSelectOpen, isDateOpen, isDateTimeOpen, isTimeOpen, isMultyPickerOpen, isCheckPickerOpen]);

  useEffect(() => {
    const fieldDbName = fromCamelCaseToDBName(fieldName);
    if (vr && vr.details && vr.details[fieldDbName]) {
      // keep local state updated when props changes
      setValidationResult(preValue => {
        return [...vr.details[fieldDbName]];
      });
    } else {
      setValidationResult(undefined);
    }
  }, [vr]);

  const fieldLabel = props?.fieldLabel ?? camelCaseToLabel(fieldName);
  const handleValueChange = value => {
    if (setRecord && typeof setRecord === 'function') {
      setRecord({ ...record, [fieldName]: value });
    }

  };
  const inputWidth = props?.width ?? 145;
  const styleWidth = typeof inputWidth === 'number' ? `${inputWidth}px` : inputWidth;

  const getDynamicMenuMaxHeight = (dataList?: any[]) => {
    // If consumer provided a specific height, honor it
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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      dispatch(notify({ msg: 'Your browser does not support Speech Recognition', sev: 'error' }));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = uiSlice.lang === 'en' ? 'en-US' : 'ar-SA';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = event => {
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

  const conjureFormControl = () => {
    switch (fieldType) {
      case 'textarea':
        return (
          <InputGroup>
            <Form.Control
              style={{ width: props?.width ?? 200, height: props?.height ?? 70 }}
              disabled={props.disabled}
              name={fieldName}
              placeholder={props.placeholder}
              value={record[fieldName] ? record[fieldName] : ''}
              accepter={Textarea}
              onChange={handleValueChange}
              onKeyDown={focusNextField}
            />
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
            onChange={value => {
              handleValueChange(value);
            }}
            onClean={() => {
              handleValueChange(null);
            }}
            placeholder={props.placeholder}
            format="HH:mm"
            cleanable
            onKeyDown={focusNextField}
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
            container={
              props.container ??
              (() => {
                // Check if inside sub-child modal first
                const subChildModal = document.querySelector('.sub-child-right-modal .rs-modal-body') as HTMLElement;
                if (subChildModal) return subChildModal;
                
                // Check if inside child modal
                const childModal = document.querySelector('.child-right-modal .rs-modal-body') as HTMLElement;
                if (childModal) return childModal;
                
                // Check for any modal body - look for the last one (most recent modal)
                const allModalBodies = document.querySelectorAll('.rs-modal-body');
                if (allModalBodies.length > 0) {
                  return allModalBodies[allModalBodies.length - 1] as HTMLElement;
                }
                
                // Default to document body
                return document.body;
              })
            }
            placement={props.placement ?? 'bottomStart'}
            preventOverflow={props.preventOverflow ?? true}
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
            onOpen={() => setIsSelectOpen(true)}
            onClose={() => setIsSelectOpen(false)}
            virtualized={props?.virtualized ?? true}
          />
        );

      //<TagPicker data={data} style={{ width: 300 }} />
      case 'multyPicker':
        return (
          <Form.Control
            style={{ width: props?.width ?? 145, height: props?.height ?? 30 }}
            block
            disabled={props.disabled}
            accepter={TagPicker}
            container={
              props.container ??
              (() => {
                // Check if inside sub-child modal first
                const subChildModal = document.querySelector('.sub-child-right-modal .rs-modal-body') as HTMLElement;
                if (subChildModal) return subChildModal;
                
                // Check if inside child modal
                const childModal = document.querySelector('.child-right-modal .rs-modal-body') as HTMLElement;
                if (childModal) return childModal;
                
                // Check for any modal body - look for the last one (most recent modal)
                const allModalBodies = document.querySelectorAll('.rs-modal-body');
                if (allModalBodies.length > 0) {
                  return allModalBodies[allModalBodies.length - 1] as HTMLElement;
                }
                
                // Default to document body
                return document.body;
              })
            }
            placement={props.placement ?? 'bottomStart'}
            preventOverflow={props.preventOverflow ?? true}
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
            container={
              props.container ??
              (() => {
                // Check if inside sub-child modal first
                const subChildModal = document.querySelector('.sub-child-right-modal .rs-modal-body') as HTMLElement;
                if (subChildModal) return subChildModal;
                
                // Check if inside child modal
                const childModal = document.querySelector('.child-right-modal .rs-modal-body') as HTMLElement;
                if (childModal) return childModal;
                
                // Check for any modal body - look for the last one (most recent modal)
                const allModalBodies = document.querySelectorAll('.rs-modal-body');
                if (allModalBodies.length > 0) {
                  return allModalBodies[allModalBodies.length - 1] as HTMLElement;
                }
                
                // Default to document body
                return document.body;
              })
            }
            placement={props.placement ?? 'bottomStart'}
            preventOverflow={props.preventOverflow ?? true}
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
          />
        );
      case 'number': {
        const inputWidth = props?.width ?? 145;
        const addonWidth = 40;

        const calculateTextWidth = text => {
          if (!text) return addonWidth;
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          context.font =
            '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial';
          const metrics = context.measureText(text.toString());
          return Math.ceil(metrics.width) + 18;
        };

        const leftWidth = leftAddon
          ? leftAddonwidth === 'auto'
            ? calculateTextWidth(leftAddon)
            : leftAddonwidth ?? addonWidth
          : 0;

        const rightWidth = rightAddon
          ? rightAddonwidth === 'auto'
            ? calculateTextWidth(rightAddon)
            : rightAddonwidth ?? addonWidth
          : 0;

        const totalWidth = inputWidth + rightWidth + (rightAddon ? 2 : 0);

        const inputControl = (
          <Form.Control
            className={`arrow-number-style ${inputColor ? `input-${inputColor}` : ''}`}
            style={{
              width: inputWidth,
              height: props?.height ?? 30,
              minWidth: inputWidth,
              maxWidth: inputWidth,
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

      default:
        const inputWidth = props?.width ?? 145;
        const addonWidth = 40;
        const totalWidth =
          inputWidth +
          (leftAddon ? (leftAddonwidth ? leftAddonwidth : addonWidth) : 0) +
          (rightAddon ? (rightAddonwidth ? rightAddonwidth : addonWidth) : 0);

        const inputControl = (
          //  <InputGroup style={{ width: totalWidth + 20 }}>
          //   <Form.Control
          //     labelKey={props?.selectDataLabel ?? ''}
          //     style={{ width: inputWidth, height: props?.height ?? 30 }}
          //     disabled={props.disabled}
          //     name={fieldName}
          //     type={fieldType}
          //     value={record ? record[fieldName] : ''}
          //     onChange={handleValueChange}
          //     placeholder={props.placeholder}
          //     onKeyDown={async e => {
          //       if (e.key === 'Enter') {
          //         e.preventDefault();
          //         const result = await props.enterClick?.();
          //         if (result !== false) {
          //           handleEnterFocusNext(e);
          //         }
          //       }
          //     }}
          //   />
          //     <div
          //     className={`container-of-search-icon ${recording ? 'recording' : ''}`}
          //     onClick={changeRecordingState}
          //     style={{ position: 'relative' }}
          //   >
          //     <FontAwesomeIcon
          //       icon={faMicrophone}
          //       className={props.disabled ? 'disabled-icon' : 'active-icon'}
          //     />
          //      {recording && <span className="pulse-ring"></span>}
          //   </div>
          //   </InputGroup>
          <div style={{ position: 'relative', display: 'inline-block', width: inputWidth }}>
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
                    handleEnterFocusNext(e);
                  }
                }
              }}
            />

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
  };

  const conjureValidationMessages = () => {
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
      {props.column && <br />}
      {conjureFormControl()}
      {validationResult && conjureValidationMessages()}
    </Form.Group>
  );
};

export default MyInput;
