import React from 'react';
import { Form } from 'rsuite';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import MyLabel from '../MyLabel';
import { camelCaseToLabel } from '@/utils';
import './styles.less';

type PhoneNumberInputProps = {
  fieldName?: string;
  record?: any;
  setRecord?: (record: any) => void;
  value?: string;
  onChange?: (phone: string) => void;
  fieldLabel?: string;
  showLabel?: boolean;
  required?: boolean;
  disabled?: boolean;
  defaultCountry?: string;
  placeholder?: string;
  width?: number | string;
  className?: string;
  column?: boolean;
};

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  fieldName = 'phoneNumber',
  record = {},
  setRecord,
  value,
  onChange,
  fieldLabel,
  showLabel = true,
  required = false,
  disabled = false,
  defaultCountry = 'sa',
  placeholder = 'Enter phone number',
  width = 145,
  className = '',
  column = false
}) => {
  const mode = useSelector((state: any) => state.ui.mode);
  const label = fieldLabel ?? camelCaseToLabel(fieldName);
  const resolvedValue = value ?? String(record?.[fieldName] ?? '');

  const handleChange = (phone: string) => {
    onChange?.(phone);
    if (setRecord && fieldName) {
      setRecord({ ...(record ?? {}), [fieldName]: phone });
    }
  };

  return (
    <Form.Group className={clsx(`my-input-container ${mode === 'light' ? 'light' : 'dark'}`, className)}>
      <Form.ControlLabel>
        {showLabel && <MyLabel label={label} />}
        {required && <span className="required-field">*</span>}
      </Form.ControlLabel>
      {column && <div style={{ marginBottom: 5 }} />}
      <div
        className={clsx('phone-number-input-wrapper', mode === 'light' ? 'light' : 'dark')}
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
      >
        <PhoneInput
          defaultCountry={defaultCountry}
          value={resolvedValue}
          onChange={phone => handleChange(phone)}
          disabled={disabled}
          inputProps={{ placeholder }}
        />
      </div>
    </Form.Group>
  );
};

export default PhoneNumberInput;
