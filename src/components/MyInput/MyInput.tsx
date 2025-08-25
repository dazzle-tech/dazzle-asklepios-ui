import { camelCaseToLabel, fromCamelCaseToDBName } from '@/utils';
import React, { useEffect, useState, ForwardedRef } from 'react';
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
  // <<< Added this line here to fix the error
  const inputColor = props.inputColor || record?.inputColor || '';

  const [validationResult, setValidationResult] = useState(undefined);
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
    setRecord({ ...record, [fieldName]: value });
  };
  const inputWidth = props?.width ?? 145;
  const styleWidth = typeof inputWidth === 'number' ? `${inputWidth}px` : inputWidth;

  const conjureFormControl = () => {
    switch (fieldType) {
      case 'textarea':
        return (
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
            name={fieldName}
            data={props?.selectData ?? []}
            labelKey={props?.selectDataLabel ?? ''}
            valueKey={props?.selectDataValue ?? ''}
            value={record ? record[fieldName] : ''}
            onChange={handleValueChange}
            defaultValue={props.defaultSelectValue}
            placeholder={props.placeholder}
            searchable={props.searchable}
            menuMaxHeight={props?.menuMaxHeight ?? ''}
            onKeyDown={focusNextField}
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
            menuMaxHeight={props?.menuMaxHeight ?? ''}
            onKeyDown={focusNextField}
          />
        );
      case 'checkPicker':
        return (
          <Form.Control
            style={{ width: props?.width ?? 145, height: props?.height ?? 30 }}
            block
            disabled={props.disabled}
            accepter={CheckPicker}
            name={fieldName}
            data={props?.selectData ?? []}
            labelKey={props?.selectDataLabel ?? ''}
            valueKey={props?.selectDataValue ?? ''}
            value={record ? record[fieldName] : []} // Multiple values as array
            onChange={handleValueChange} // Pass handler for multiple value selection
            placeholder={props.placeholder ?? 'Select...'}
            groupBy={props.groupBy ?? null} // Optional: Grouping feature if required
            searchBy={props.searchBy} // Optional: Search function for checkPicker
            menuMaxHeight={props?.menuMaxHeight ?? ''}
            onKeyDown={focusNextField}
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
        const totalWidth =
          inputWidth +
          (leftAddon ? leftAddonwidth ?? addonWidth : 0) +
          (rightAddon ? rightAddonwidth ?? addonWidth : 0);

        const inputControl = (
          <Form.Control
            className={`arrow-number-style ${inputColor ? `input-${inputColor}` : ''}`}
            style={{ width: inputWidth, height: props?.height ?? 30 }}
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
                  style={{
                    width: leftAddonwidth ?? addonWidth,
                    textAlign: 'center',
                    color: '#A1A9B8',
                    backgroundColor: '#e0e0e0',
                    pointerEvents: 'none', // <-- حتى ما يتفاعل لكن يضل شكله طبيعي
                    opacity: 1 // <-- يخلي اللون طبيعي حتى لو الـ input معطل
                  }}
                >
                  {leftAddon}
                </InputGroup.Addon>
              )}
              {inputControl}
              {rightAddon && (
                <InputGroup.Addon
                  style={{
                    width: rightAddonwidth ?? addonWidth,
                    textAlign: 'center',
                    color: '#A1A9B8',
                    backgroundColor: '#e0e0e0',
                    pointerEvents: 'none',
                    opacity: 1
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
            {props.label ?? fieldLabel}
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
          <Form.Control
            labelKey={props?.selectDataLabel ?? ''}
            style={{ width: inputWidth, height: props?.height ?? 30 }}
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
    <Form.Group className={clsx(`my-input-container ${className}`)}>
      <Form.ControlLabel>
        {showLabel && <MyLabel label={fieldLabel} error={validationResult} />}
        {props.required && <span className="required-field ">*</span>}
      </Form.ControlLabel>
      {props.column && <br />}
      {conjureFormControl()}
      {validationResult && conjureValidationMessages()}
    </Form.Group>
  );
};

export default MyInput;
