import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import { useEnumOptions } from '@/services/enumsApi';
import { WhatsAppButton } from '@/types/model-types-new';
import { newWhatsAppButton } from '@/types/model-types-constructor-new';
import PlusIcon from '@rsuite/icons/Plus';
import TrashIcon from '@rsuite/icons/Trash';
import React from 'react';
import { Col, Row } from 'rsuite';

const MAX_WHATSAPP_BUTTONS = 3;

interface WhatsAppButtonsInputProps {
  value?: WhatsAppButton[] | null;
  onChange: (buttons: WhatsAppButton[]) => void;
}

const WhatsAppButtonsInput: React.FC<WhatsAppButtonsInputProps> = ({ value, onChange }) => {
  const buttonTypeOptions = useEnumOptions('WhatsAppButtonType');
  const buttons = value?.length ? value : [{ ...newWhatsAppButton }];

  const updateButton = (index: number, patch: Partial<WhatsAppButton>) => {
    onChange(buttons.map((button, idx) => (idx === index ? { ...button, ...patch } : button)));
  };

  const addButton = () => {
    if (buttons.length >= MAX_WHATSAPP_BUTTONS) return;
    onChange([...buttons, { ...newWhatsAppButton }]);
  };

  const removeButton = (index: number) => {
    const nextButtons = buttons.filter((_, idx) => idx !== index);
    onChange(nextButtons.length > 0 ? nextButtons : [{ ...newWhatsAppButton }]);
  };

  return (
    <div className="whatsapp-buttons-input">
      <MyLabel label="WhatsApp Template Buttons" />
      {buttons.map((button, index) => {
        const buttonType = button.type ?? '';
        const showUrl = buttonType === 'URL';
        const showPhoneNumber = buttonType === 'PHONE_NUMBER';
        const showCouponCode = buttonType === 'COPY_CODE';
        const showFlowId = buttonType === 'FLOW';

        return (
          <div key={`whatsapp-button-${index}`} className="whatsapp-buttons-input__row">
            <Row>
              <Col md={12}>
                <MyInput
                  fieldName="type"
                  fieldType="select"
                  fieldLabel="Button Type"
                  selectData={buttonTypeOptions}
                  selectDataLabel="label"
                  selectDataValue="value"
                  isEnum
                  record={button}
                  setRecord={record => updateButton(index, record)}
                  width="100%"
                />
              </Col>
              <Col md={12}>
                <MyInput
                  fieldName="text"
                  fieldType="text"
                  fieldLabel="Button Text"
                  record={button}
                  setRecord={record => updateButton(index, record)}
                  width="100%"
                />
              </Col>
            </Row>
            {(showUrl || showPhoneNumber || showCouponCode || showFlowId) && (
              <Row>
                {showUrl && (
                  <Col md={24}>
                    <MyInput
                      fieldName="url"
                      fieldType="text"
                      fieldLabel="URL"
                      record={button}
                      setRecord={record => updateButton(index, record)}
                      width="100%"
                    />
                  </Col>
                )}
                {showPhoneNumber && (
                  <Col md={24}>
                    <MyInput
                      fieldName="phoneNumber"
                      fieldType="text"
                      fieldLabel="Phone Number"
                      record={button}
                      setRecord={record => updateButton(index, record)}
                      width="100%"
                    />
                  </Col>
                )}
                {showCouponCode && (
                  <Col md={24}>
                    <MyInput
                      fieldName="couponCode"
                      fieldType="text"
                      fieldLabel="Coupon Code"
                      record={button}
                      setRecord={record => updateButton(index, record)}
                      width="100%"
                    />
                  </Col>
                )}
                {showFlowId && (
                  <Col md={24}>
                    <MyInput
                      fieldName="flowId"
                      fieldType="text"
                      fieldLabel="Flow ID"
                      record={button}
                      setRecord={record => updateButton(index, record)}
                      width="100%"
                    />
                  </Col>
                )}
              </Row>
            )}
            <div className="whatsapp-buttons-input__actions">
              {buttons.length > 1 && (
                <MyButton appearance="subtle" onClick={() => removeButton(index)}>
                  <TrashIcon /> Remove
                </MyButton>
              )}
            </div>
          </div>
        );
      })}
      {buttons.length < MAX_WHATSAPP_BUTTONS && (
        <MyButton appearance="ghost" onClick={addButton}>
          <PlusIcon /> Add Button
        </MyButton>
      )}
    </div>
  );
};

export default WhatsAppButtonsInput;
