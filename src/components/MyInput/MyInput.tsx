import { camelCaseToLabel, fromCamelCaseToDBName } from '@/utils';
import React, { useEffect, useState } from 'react';
import { Form, Input, DatePicker, Checkbox, Toggle, SelectPicker, InputNumber, TagPicker } from 'rsuite';
import MyLabel from '../MyLabel';
import Translate from '../Translate';

const Textarea = React.forwardRef((props, ref: any) => (
  <Input {...props} as="textarea" ref={ref} />
));

const CustomDatePicker = React.forwardRef((props, ref: any) => (
  <DatePicker {...props} oneTap cleanable={false} block ref={ref} />
));

const MyInput = ({
  fieldName,
  fieldType = 'text',
  record,
  setRecord = undefined,
  vr = undefined, // form validation result
  ...props
}) => {
  const [validationResult, setValidationResult] = useState(undefined);

  useEffect(() => {
    let fieldDbName = fromCamelCaseToDBName(fieldName);
    if (vr && vr.details && vr.details[fieldDbName]) {
      // keep local state updated when props changes
      setValidationResult(preValue => {
        console.log(preValue);
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


  const conjureFormControl = () => {
    switch (fieldType) {
      case 'textarea':
        return (
          <Form.Control
            style={{ width: props?.width ?? 260 ,height:props?.height??50}}
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
            checkedChildren={props.checkedLabel || "Yes"}
            unCheckedChildren={props.unCheckedLabel || "No"}
            disabled={props.disabled}
            checked={record[fieldName]}
            onChange={handleValueChange}
            defaultChecked={props.defaultChecked}
          />
        );
      case 'select':
        return (
          <Form.Control
            style={{ width: props?.width ?? 260 }}
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
          />
        );
      //<TagPicker data={data} style={{ width: 300 }} />
      case 'multyPicker':
        return (
          <Form.Control
            style={{ width: props?.width ?? 260 }}
            block
            disabled={props.disabled}
            accepter={TagPicker}
            name={fieldName}
            data={props?.selectData ?? []}
            labelKey={props?.selectDataLabel ?? ''}
            valueKey={props?.selectDataValue ?? ''}
            value={record ? record[fieldName] : []}  // Multiple values as array
            onChange={handleValueChange}  // Pass handler for multiple value selection
            placeholder={props.placeholder ?? 'Select...'}
            creatable={props.creatable ?? false} // Optional: Allow users to create new tags
            groupBy={props.groupBy ?? null} // Optional: Grouping feature if required
            searchBy={props.searchBy}  // Optional: Search function for TagPicker
          />
        );
      case 'date':
        return (
          <Form.Control
            style={{ width: props?.width ?? 260 }}
            disabled={props.disabled}
            name={fieldName}
            value={record[fieldName] ? new Date(record[fieldName]) : null}
            accepter={CustomDatePicker}
            
            onChange={handleValueChange}
          />
        );
      case 'number':
        return (
          <Form.Control
            style={{ width: props?.width ?? 260 }}
            disabled={props.disabled}
            name={fieldName}
            max={props.max ? props.max : 1000000}
            value={record[fieldName] ? record[fieldName] : 0}
            accepter={InputNumber}
            onChange={handleValueChange}
          />
        );
      default:
        return (
          <Form.Control
            labelKey={props?.selectDataLabel ?? ''}

            style={{ width: props?.width ?? 260 }}
            disabled={props.disabled}
            name={fieldName}
            type={fieldType}
            value={record ? record[fieldName] : ''}
            onChange={handleValueChange}

          />
        );
    }
  };

  const conjureValidationMessages = () => {
    let msgs = [];

    let i = 0;
    for (let vrs of validationResult) {
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
    <>
      <Form.Group>
        <Form.ControlLabel>
          {props.required && (
            <span style={{ color: 'red', fontSize: '110%', margin: '2px' }}>*</span>
          )}
          <MyLabel label={fieldLabel} error={validationResult} />
        </Form.ControlLabel>
        {props.column && <br />}
        {conjureFormControl()}
        {validationResult && conjureValidationMessages()}
      </Form.Group>
    </>
  );
};

export default MyInput;
