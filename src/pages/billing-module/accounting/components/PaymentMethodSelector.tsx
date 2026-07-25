import React from 'react';
import { Form, Radio, RadioGroup } from 'rsuite';

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
};

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  label = 'Payment method',
  value,
  options,
  onChange,
  disabled = false
}) => (
  <Form.Group>
    <Form.ControlLabel>{label}</Form.ControlLabel>
    <RadioGroup
      name="paymentMethodCode"
      value={value || undefined}
      onChange={nextValue => onChange(nextValue == null ? '' : String(nextValue))}
    >
      <div className="billing-payment-method-options">
        {options.map(option => (
          <Radio key={option.value} value={option.value} disabled={disabled}>
            {option.label}
          </Radio>
        ))}
      </div>
    </RadioGroup>
  </Form.Group>
);

export default PaymentMethodSelector;
