import { camelCaseToLabel, fromCamelCaseToDBName } from '@/utils';
import React, { useEffect, useState, ForwardedRef } from 'react';
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

const Textarea = React.forwardRef((props, ref: any) => (
  <Input {...props} as="textarea" ref={ref} />
));

const CustomDatePicker = React.forwardRef((props, ref: any) => (
  <DatePicker {...props} oneTap cleanable={false} block ref={ref} />
));
const CustomDateTimePicker = React.forwardRef(
  (props: any, ref: ForwardedRef<HTMLDivElement>) => (
    <DatePicker
      {...props}
      oneTap
      showMeridian
      format="MM/dd/yyyy hh:mm aa"
      cleanable={false}
      block
      ref={ref}
    />
  )
);

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
  ...props
}) => {
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
          />
        );
      case 'datetime':
        return (
          <Form.Control
            className="custom-date-input"
            style={{ width: props?.width ?? 145, '--input-height': `${props?.height ?? 30}px` } as React.CSSProperties}
            disabled={props.disabled}
            name={fieldName}
            value={record[fieldName] ? new Date(record[fieldName]) : null}
            accepter={CustomDateTimePicker}
            onChange={handleValueChange}
            placeholder={props.placeholder}
          />
        );
      case 'select':
        return (
          <Form.Control
            style={{ width: styleWidth, height: props?.height ?? 30 }}
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
            className="my-input"
            searchable={props.searchable}
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
          />
        );
      case 'number': {
        const inputWidth = props?.width ?? 145;
        const addonWidth = 40;
        const totalWidth =
          inputWidth +
          (leftAddon ? (leftAddonwidth ?? addonWidth) : 0) +
          (rightAddon ? (rightAddonwidth ?? addonWidth) : 0);

        const inputControl = (
          <Form.Control
            style={{ width: inputWidth, height: props?.height ?? 30 }}
            disabled={props.disabled}
            name={fieldName}
            max={props.max ? props.max : 1000000}
            value={record[fieldName] ? record[fieldName] : ''}
            accepter={InputNumber}
            onChange={handleValueChange}
            placeholder={props.placeholder}
          />
        );

        if (leftAddon || rightAddon) {
          return (
            <InputGroup style={{ width: totalWidth }}>
              {leftAddon && (
                <InputGroup.Addon style={{ width: leftAddonwidth ?? addonWidth, textAlign: 'center', color: '#A1A9B8', backgroundColor: '#e0e0e0' }}>
                  {leftAddon}
                </InputGroup.Addon>
              )}
              {inputControl}
              {rightAddon && (
                <InputGroup.Addon style={{ width: rightAddonwidth ?? addonWidth, textAlign: 'center', color: '#A1A9B8', backgroundColor: '#e0e0e0' }}>
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
            className="check-box-style"
          >
            {props.label ?? fieldLabel}
          </Checkbox>
        );
      default:
        const inputWidth = props?.width ?? 145;
        const addonWidth = 40;
        const totalWidth =

          inputWidth + (leftAddon ? leftAddonwidth ? leftAddonwidth : addonWidth : 0) + (rightAddon ? rightAddonwidth ? rightAddonwidth : addonWidth : 0);

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
          />
        );

        if (leftAddon || rightAddon) {
          return (
            <InputGroup style={{ width: totalWidth }}>
              {leftAddon && <InputGroup.Addon style={{ width: addonWidth, textAlign: 'center' }}>{leftAddon}</InputGroup.Addon>}
              {inputControl}
              {rightAddon && <InputGroup.Addon style={{ width: addonWidth, textAlign: 'center' }}>{rightAddon}</InputGroup.Addon>}
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
    <Form.Group className="my-input-container">
      <Form.ControlLabel >
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
