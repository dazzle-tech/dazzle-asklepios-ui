import React from 'react';
import { Form, SelectPicker } from 'rsuite';

export type PaymentMethodOption = {
  value: string;
  label: string;
};

type PaymentMethodSelectorProps = {
  label?: string;
  value: string;
  options: PaymentMethodOption[];
  onChange: (paymentMethodCode: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  label = 'Payment method',
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Select payment method'
}) => (
  <Form.Group>
    <Form.ControlLabel>{label}</Form.ControlLabel>
    <SelectPicker
      block
      cleanable={false}
      searchable={false}
      disabled={disabled}
      data={options}
      labelKey="label"
      valueKey="value"
      placeholder={placeholder}
      value={value || null}
      onChange={nextValue => onChange(nextValue == null ? '' : String(nextValue))}
      style={{ width: '100%' }}
      menuStyle={{ zIndex: 2000 }}
    />
  </Form.Group>
);

export default PaymentMethodSelector;
