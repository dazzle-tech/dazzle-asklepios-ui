import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import { WhatsAppTemplateParameter } from '@/types/model-types-new';
import { newWhatsAppTemplateParameter } from '@/types/model-types-constructor-new';
import PlusIcon from '@rsuite/icons/Plus';
import TrashIcon from '@rsuite/icons/Trash';
import React from 'react';
import { Col, Row } from 'rsuite';
import { sanitizeWhatsappTemplateNameInput } from '../notificationTemplateValidation';

interface WhatsAppParametersInputProps {
  value?: WhatsAppTemplateParameter[] | null;
  onChange: (parameters: WhatsAppTemplateParameter[]) => void;
}

const WhatsAppParametersInput: React.FC<WhatsAppParametersInputProps> = ({ value, onChange }) => {
  const parameters = value?.length ? value : [{ ...newWhatsAppTemplateParameter }];

  const updateParameter = (index: number, patch: Partial<WhatsAppTemplateParameter>) => {
    onChange(parameters.map((parameter, idx) => (idx === index ? { ...parameter, ...patch } : parameter)));
  };

  const addParameter = () => {
    onChange([...parameters, { ...newWhatsAppTemplateParameter }]);
  };

  const removeParameter = (index: number) => {
    const nextParameters = parameters.filter((_, idx) => idx !== index);
    onChange(nextParameters.length > 0 ? nextParameters : [{ ...newWhatsAppTemplateParameter }]);
  };

  return (
    <div className="whatsapp-parameters-input">
      <MyLabel label="WhatsApp Parameters" />
      {parameters.map((parameter, index) => (
        <div key={`whatsapp-parameter-${index}`} className="whatsapp-parameters-input__row">
          <Row>
            <Col md={12}>
              <MyInput
                fieldName="parameterName"
                fieldType="text"
                fieldLabel="Parameter Name"
                placeholder="facility_name"
                record={parameter}
                setRecord={record =>
                  updateParameter(index, {
                    parameterName: sanitizeWhatsappTemplateNameInput(record.parameterName),
                  })
                }
                width="100%"
              />
            </Col>
            <Col md={12}>
              <MyInput
                fieldName="exampleValue"
                fieldType="text"
                fieldLabel="Example Value"
                placeholder="City Hospital"
                record={parameter}
                setRecord={record => updateParameter(index, record)}
                width="100%"
              />
            </Col>
          </Row>
          <div className="whatsapp-parameters-input__actions">
            {parameters.length > 1 && (
              <MyButton appearance="subtle" onClick={() => removeParameter(index)}>
                <TrashIcon /> Remove
              </MyButton>
            )}
          </div>
        </div>
      ))}
      <MyButton appearance="ghost" onClick={addParameter}>
        <PlusIcon /> Add Parameter
      </MyButton>
      <div className="whatsapp-parameters-field__hint">
        Use lowercase parameter names with underscores. Example:{' '}
        <code>facility_name</code> with example value <code>City Hospital</code>
      </div>
    </div>
  );
};

export default WhatsAppParametersInput;
